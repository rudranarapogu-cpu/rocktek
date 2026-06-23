import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ORDER_STATUS_LABEL, inr } from "@/lib/logistics";
import { toast } from "sonner";

export const Route = createFileRoute("/seller/orders")({
  component: SellerOrders,
});

function SellerOrders() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [trips, setTrips] = useState<Record<string, any>>({});
  const [drivers, setDrivers] = useState<any[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async (sellerId: string) => {
    const [{ data: o }, { data: t }, { data: d }] = await Promise.all([
      supabase.from("orders").select("*,listings(title,unit_type)").eq("seller_id", sellerId).order("created_at", { ascending: false }),
      supabase.from("trips").select("*").eq("seller_id", sellerId),
      supabase.from("drivers_public").select("id,full_name,vehicle_type"),
    ]);
    setOrders(o ?? []);
    // ignore rejected trips so the order can be reassigned
    const active = (t ?? []).filter((x) => x.acceptance !== "rejected");
    setTrips(Object.fromEntries(active.map((x) => [x.order_id, x])));
    setDrivers(d ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setSeller(data);
      if (data) load(data.id); else setLoading(false);
    });
  }, [user]);

  const assign = async (order: any) => {
    const driverId = pick[order.id];
    if (!driverId) return toast.error("Pick a driver first");
    const { error } = await supabase.from("trips").insert({
      order_id: order.id,
      driver_id: driverId,
      seller_id: seller.id,
      status: "assigned",
    });
    if (error) return toast.error(error.message);
    await supabase.from("orders").update({ status: "dispatched" }).eq("id", order.id);
    toast.success("Driver assigned & trip created");
    load(seller.id);
  };

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Seller</p>
      <h1 className="mt-1 font-display text-3xl">Orders</h1>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No orders yet. Bookings from buyers will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => {
            const trip = trips[o.id];
            return (
              <div key={o.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg">{o.listings?.title}</p>
                    <p className="text-sm text-muted-foreground">{o.buyer_name} · {o.buyer_phone} · {o.quantity} {o.listings?.unit_type}</p>
                    <p className="text-xs text-muted-foreground">{o.delivery_address}</p>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">{ORDER_STATUS_LABEL[o.status]}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Total <b className="text-foreground">{inr(Number(o.total_amount))}</b></span>
                  <span className="text-muted-foreground">Advance <b className="text-primary">{inr(Number(o.advance_amount))}</b></span>
                </div>

                {trip ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary">
                    <Truck className="h-4 w-4" /> Dispatched — trip status: {trip.status}
                  </div>
                ) : o.status === "confirmed" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="w-56">
                      <Select value={pick[o.id] ?? ""} onValueChange={(v) => setPick((p) => ({ ...p, [o.id]: v }))}>
                        <SelectTrigger><SelectValue placeholder="Assign a driver" /></SelectTrigger>
                        <SelectContent>
                          {drivers.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">No approved drivers yet</div>
                          ) : drivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.full_name} · {d.vehicle_type ?? "Truck"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => assign(o)} className="bg-primary">Dispatch</Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
