import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TripMap } from "@/components/trip-map";
import { TripTimeline } from "@/components/trip-timeline";
import { useTripLive } from "@/hooks/use-trip-live";
import { TRIP_STATUS_LABEL } from "@/lib/logistics";

export const Route = createFileRoute("/buyer/tracking")({
  component: BuyerTracking,
});

function BuyerTracking() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: orders } = await supabase.from("orders").select("id,listings(title)").eq("buyer_id", user.id);
      const ids = (orders ?? []).map((o) => o.id);
      if (ids.length === 0) { setLoading(false); return; }
      const { data: t } = await supabase
        .from("trips")
        .select("id,status,current_lat,current_lng,order_id")
        .in("order_id", ids)
        .order("created_at", { ascending: false });
      const titleByOrder = Object.fromEntries((orders ?? []).map((o: any) => [o.id, o.listings?.title]));
      setTrips((t ?? []).map((x) => ({ ...x, title: titleByOrder[x.order_id] })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Buyer</p>
      <h1 className="mt-1 font-display text-3xl">Live Tracking</h1>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No active shipments yet. Tracking appears once a seller dispatches your order.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {trips.map((t) => <TrackingCard key={t.id} trip={t} />)}
        </div>
      )}
    </div>
  );
}

function TrackingCard({ trip }: { trip: any }) {
  const live = useTripLive(trip.id, trip);
  const status = (live?.status ?? trip.status) as TripStatus;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl">{trip.title ?? "Shipment"}</p>
        <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{TRIP_STATUS_LABEL[status]}</span>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <TripMap lat={live?.current_lat} lng={live?.current_lng} />
        <TripTimeline status={status} />
      </div>
    </div>
  );
}
