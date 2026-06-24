import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, Clock, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TripEventsLog } from "@/components/trip-events-log";

export const Route = createFileRoute("/driver/history")({
  component: DeliveryHistory,
});

function DeliveryHistory() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [proofs, setProofs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: d } = await supabase.from("drivers").select("id").eq("user_id", user.id).maybeSingle();
      if (!d) { setLoading(false); return; }
      const { data: t } = await supabase
        .from("trips")
        .select("id,order_id,delivered_at,orders(buyer_name,delivery_address,listings(title))")
        .eq("driver_id", d.id)
        .eq("status", "delivered")
        .order("delivered_at", { ascending: false });
      setTrips(t ?? []);
      const ids = (t ?? []).map((x) => x.id);
      if (ids.length) {
        const { data: p } = await supabase.from("delivery_proofs").select("*").in("trip_id", ids);
        setProofs(Object.fromEntries((p ?? []).map((x) => [x.trip_id, x])));
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Driver</p>
      <h1 className="mt-1 font-display text-3xl">Completed Deliveries</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your delivery record with saved time, location and proof.</p>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No completed deliveries yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {trips.map((t) => {
            const proof = proofs[t.id];
            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg">{t.orders?.listings?.title ?? "Shipment"}</p>
                    <p className="text-sm text-muted-foreground">{t.orders?.buyer_name} · {t.orders?.delivery_address}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-1 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                  </span>
                </div>
                {t.delivered_at && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {new Date(t.delivered_at).toLocaleString()}
                  </p>
                )}
                {proof?.image_url && (
                  <a href={proof.image_url} target="_blank" rel="noreferrer" className="mt-3 block">
                    <img src={proof.image_url} alt="Delivery proof" className="h-40 w-full rounded-lg border border-border object-cover" />
                  </a>
                )}
                {proof?.notes && <p className="mt-2 text-sm text-muted-foreground">{proof.notes}</p>}
                <div className="mt-3"><TripEventsLog tripId={t.id} /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
