import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TripMap } from "@/components/trip-map";
import { TripTimeline } from "@/components/trip-timeline";
import { useTripLive } from "@/hooks/use-trip-live";
import { TRIP_STATUS_LABEL, type TripStatus } from "@/lib/logistics";

export const Route = createFileRoute("/seller/dispatches")({
  component: SellerDispatches,
});

function SellerDispatches() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("sellers").select("id").eq("user_id", user.id).maybeSingle();
      if (!s) { setLoading(false); return; }
      const { data } = await supabase
        .from("trips")
        .select("*,orders(buyer_name,delivery_address,listings(title)),drivers(full_name,vehicle_number)")
        .eq("seller_id", s.id)
        .order("created_at", { ascending: false });
      setTrips(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Seller</p>
      <h1 className="mt-1 font-display text-3xl">Dispatches</h1>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No dispatches yet. Assign a driver from the Orders tab.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">{trips.map((t) => <DispatchCard key={t.id} trip={t} />)}</div>
      )}
    </div>
  );
}

function DispatchCard({ trip }: { trip: any }) {
  const live = useTripLive(trip.id, trip);
  const status = (live?.status ?? trip.status) as TripStatus;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-xl">{trip.orders?.listings?.title ?? "Shipment"}</p>
          <p className="text-sm text-muted-foreground">
            {trip.drivers?.full_name} · {trip.drivers?.vehicle_number} → {trip.orders?.buyer_name}
          </p>
        </div>
        <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{TRIP_STATUS_LABEL[status]}</span>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <TripMap lat={live?.current_lat} lng={live?.current_lng} />
        <TripTimeline status={status} />
      </div>
    </div>
  );
}
