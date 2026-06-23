import { useEffect, useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TripEvent {
  id: string;
  status: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
  created_at: string;
}

// Shows the saved time + location captured at each completed step of a trip.
export function TripEventsLog({ tripId }: { tripId: string }) {
  const [events, setEvents] = useState<TripEvent[]>([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      supabase
        .from("trip_events")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (active) setEvents((data ?? []) as TripEvent[]);
        });
    load();
    const channel = supabase
      .channel(`trip-events-${tripId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trip_events", filter: `trip_id=eq.${tripId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  if (events.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step history</p>
      <ol className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="text-xs">
            <span className="font-medium capitalize text-foreground">{e.status.replace(/_/g, " ")}</span>
            <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(e.created_at).toLocaleString()}
            </span>
            {e.lat != null && e.lng != null && (
              <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {e.lat.toFixed(4)}, {e.lng.toFixed(4)}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
