import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navigation, Play, Square, ArrowRight, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useGpsShare } from "@/hooks/use-gps-share";
import { TripMap } from "@/components/trip-map";
import { TripTimeline } from "@/components/trip-timeline";
import { TRIP_STATUS_LABEL, nextTripStatus, type TripStatus } from "@/lib/logistics";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/active")({
  component: ActiveTrips,
});

function ActiveTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: d } = await supabase.from("drivers").select("id").eq("user_id", user.id).maybeSingle();
    if (!d) { setLoading(false); return; }
    const { data } = await supabase
      .from("trips")
      .select("*,orders(buyer_name,delivery_address,listings(title))")
      .eq("driver_id", d.id)
      .eq("acceptance", "accepted")
      .neq("status", "delivered")
      .order("created_at", { ascending: false });
    setTrips(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Driver</p>
      <h1 className="mt-1 font-display text-3xl">Active Trips & GPS</h1>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Navigation className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No active trips. Delivered trips move to history.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">{trips.map((t) => <ActiveTripCard key={t.id} trip={t} onChange={load} />)}</div>
      )}
    </div>
  );
}

function ActiveTripCard({ trip, onChange }: { trip: any; onChange: () => void }) {
  const gps = useGpsShare(trip.id);
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const next = nextTripStatus(status);

  const advance = async () => {
    if (!next) return;
    const patch: any = { status: next };
    if (status === "assigned") patch.started_at = new Date().toISOString();
    if (next === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("trips").update(patch).eq("id", trip.id);
    if (error) return toast.error(error.message);
    setStatus(next);
    if (next === "delivered") {
      await supabase.from("orders").update({ status: "delivered", payment_status: "paid" }).eq("id", trip.order_id);
      gps.stop();
      toast.success("Trip delivered! Upload proof of delivery.");
      onChange();
    } else {
      toast.success(`Status: ${TRIP_STATUS_LABEL[next]}`);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-xl">{trip.orders?.listings?.title ?? "Shipment"}</p>
          <p className="text-sm text-muted-foreground">{trip.orders?.buyer_name} · {trip.orders?.delivery_address}</p>
        </div>
        <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{TRIP_STATUS_LABEL[status]}</span>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <TripMap lat={gps.lat} lng={gps.lng} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {gps.sharing ? (
              <Button variant="outline" onClick={gps.stop}><Square className="mr-2 h-4 w-4" /> Stop sharing</Button>
            ) : (
              <Button className="bg-primary" onClick={gps.start}><Play className="mr-2 h-4 w-4" /> Share live GPS</Button>
            )}
            {gps.sharing && <span className="text-xs text-accent-foreground">● Broadcasting location</span>}
          </div>
          {gps.error && <p className="mt-2 text-xs text-destructive">{gps.error}</p>}
        </div>

        <div>
          <TripTimeline status={status} />
          {next && (
            <Button onClick={advance} className="mt-4 w-full bg-primary">
              Advance to {TRIP_STATUS_LABEL[next]} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
