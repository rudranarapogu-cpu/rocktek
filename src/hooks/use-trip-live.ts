import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TripStatus } from "@/lib/logistics";

export interface LiveTrip {
  id: string;
  status: TripStatus;
  current_lat: number | null;
  current_lng: number | null;
}

// Subscribes to realtime updates for a single trip (status + live coordinates).
export function useTripLive(tripId: string | null, initial?: Partial<LiveTrip>) {
  const [trip, setTrip] = useState<LiveTrip | null>(
    initial && tripId
      ? {
          id: tripId,
          status: (initial.status as TripStatus) ?? "assigned",
          current_lat: initial.current_lat ?? null,
          current_lng: initial.current_lng ?? null,
        }
      : null,
  );

  useEffect(() => {
    if (!tripId) return;
    let active = true;

    supabase
      .from("trips")
      .select("id,status,current_lat,current_lng")
      .eq("id", tripId)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setTrip(data as LiveTrip);
      });

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        (payload) => {
          const r = payload.new as LiveTrip;
          setTrip({ id: r.id, status: r.status, current_lat: r.current_lat, current_lng: r.current_lng });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return trip;
}
