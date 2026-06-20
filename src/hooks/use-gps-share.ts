import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GpsState {
  sharing: boolean;
  lat: number | null;
  lng: number | null;
  error: string | null;
  lastSent: number | null;
}

// Uses the free browser Geolocation API to stream the driver's position.
// Writes to trips.current_lat/lng and appends to trip_locations (throttled).
export function useGpsShare(tripId: string | null) {
  const [state, setState] = useState<GpsState>({
    sharing: false,
    lat: null,
    lng: null,
    error: null,
    lastSent: null,
  });
  const watchId = useRef<number | null>(null);
  const lastWrite = useRef<number>(0);

  const stop = () => {
    if (watchId.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setState((s) => ({ ...s, sharing: false }));
  };

  const start = () => {
    if (!tripId) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported on this device" }));
      return;
    }
    setState((s) => ({ ...s, sharing: true, error: null }));
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = Date.now();
        setState((s) => ({ ...s, lat, lng }));
        // throttle writes to roughly every 8 seconds
        if (now - lastWrite.current < 8000) return;
        lastWrite.current = now;
        await supabase.from("trips").update({ current_lat: lat, current_lng: lng }).eq("id", tripId);
        await supabase.from("trip_locations").insert({ trip_id: tripId, lat, lng });
        setState((s) => ({ ...s, lastSent: now }));
      },
      (err) => setState((s) => ({ ...s, error: err.message, sharing: false })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  };

  useEffect(() => () => stop(), []);

  return { ...state, start, stop };
}
