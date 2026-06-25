import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Package, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ORDER_STATUS_LABEL, TRIP_STATUS_LABEL, inr, type TripStatus } from "@/lib/logistics";
import { TripMap } from "@/components/trip-map";
import { TripTimeline } from "@/components/trip-timeline";
import { TripEventsLog } from "@/components/trip-events-log";
import { useTripLive } from "@/hooks/use-trip-live";
import { toast } from "sonner";

export const Route = createFileRoute("/buyer/")({
  component: BuyerOrders,
});

function BuyerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*,listings(title,unit_type),sellers(company_name),trips(*)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Buyer</p>
      <h1 className="mt-1 font-display text-3xl">My Orders</h1>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-xl">No bookings yet</p>
          <Button asChild className="mt-4 bg-primary"><Link to="/marketplace">Browse marketplace</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => <OrderCard key={o.id} order={o} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onChange }: { order: any; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const trip = (order.trips ?? []).filter((t: any) => t.acceptance !== "rejected")[0];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full flex-wrap items-start justify-between gap-2 text-left">
        <div>
          <p className="font-display text-lg">{order.listings?.title ?? "Listing"}</p>
          <p className="text-sm text-muted-foreground">{order.sellers?.company_name} · {order.quantity} {order.listings?.unit_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={order.status} />
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">Total <b className="text-foreground">{inr(Number(order.total_amount))}</b></span>
        <span className="text-muted-foreground">Advance paid <b className="text-primary">{inr(Number(order.advance_amount))}</b></span>
        {Number(order.delivery_charge) > 0 && (
          <span className="text-muted-foreground">Delivery <b className="text-foreground">{inr(Number(order.delivery_charge))}</b></span>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="grid gap-1 text-sm sm:grid-cols-2">
            <Detail label="Delivery address" value={order.delivery_address} />
            <Detail label="Contact" value={[order.buyer_name, order.buyer_phone].filter(Boolean).join(" · ")} />
            {order.delivery_state && <Detail label="Location" value={[order.delivery_mandal, order.delivery_district, order.delivery_state].filter(Boolean).join(", ")} />}
            <Detail label="Transport" value={order.buyer_has_vehicle ? "Buyer's own vehicle" : "Seller arranged"} />
          </div>

          {order.buyer_has_vehicle && !trip ? (
            <AssignOwnDriver order={order} onChange={onChange} />
          ) : trip ? (
            <TrackingBlock trip={trip} />
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" /> Tracking will appear here once a driver is assigned and accepts.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssignOwnDriver({ order, onChange }: { order: any; onChange: () => void }) {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const assign = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return toast.error("Enter your driver's unique code");
    setSaving(true);
    const { data: drv } = await supabase.from("drivers_public").select("id,full_name").eq("public_code", c).maybeSingle();
    if (!drv) { setSaving(false); return toast.error("No verified driver found with that code"); }
    const { error } = await supabase.from("trips").insert({
      order_id: order.id,
      driver_id: drv.id as string,
      seller_id: order.seller_id,
      status: "assigned",
    });
    if (!error) await supabase.from("orders").update({ status: "dispatched" }).eq("id", order.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Assigned ${drv.full_name}. Waiting for acceptance.`);
    onChange();
  };

  return (
    <div className="rounded-lg border border-border bg-secondary/5 p-4">
      <p className="text-sm font-semibold">Assign your own driver</p>
      <p className="mt-1 text-xs text-muted-foreground">Enter your driver's unique code (e.g. DRV-AB12CD).</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="DRV-XXXXXX" className="w-48 uppercase" />
        <Button onClick={assign} disabled={saving} className="bg-primary">{saving ? "Assigning…" : "Assign driver"}</Button>
      </div>
    </div>
  );
}

function TrackingBlock({ trip }: { trip: any }) {
  const live = useTripLive(trip.id, trip);
  const status = (live?.status ?? trip.status) as TripStatus;
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 font-display text-lg"><Package className="h-4 w-4 text-primary" /> Live tracking</p>
        <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
          {trip.acceptance === "pending" ? "Awaiting driver acceptance" : TRIP_STATUS_LABEL[status]}
        </span>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <TripMap lat={live?.current_lat} lng={live?.current_lng} />
        <TripTimeline status={status} />
      </div>
      <div className="mt-4">
        <TripEventsLog tripId={trip.id} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "delivered" ? "bg-accent/20 text-accent-foreground"
    : status === "cancelled" ? "bg-destructive/15 text-destructive"
    : status === "in_transit" || status === "dispatched" ? "bg-primary/15 text-primary"
    : "bg-secondary text-secondary-foreground";
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${tone}`}>{ORDER_STATUS_LABEL[status] ?? status}</span>;
}
