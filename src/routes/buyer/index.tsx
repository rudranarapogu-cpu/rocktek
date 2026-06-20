import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ORDER_STATUS_LABEL, inr } from "@/lib/logistics";

export const Route = createFileRoute("/buyer/")({
  component: BuyerOrders,
});

function BuyerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*,listings(title,unit_type),sellers(company_name)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false); });
  }, [user]);

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
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{o.listings?.title ?? "Listing"}</p>
                  <p className="text-sm text-muted-foreground">{o.sellers?.company_name} · {o.quantity} {o.listings?.unit_type}</p>
                </div>
                <StatusPill status={o.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">Total <b className="text-foreground">{inr(Number(o.total_amount))}</b></span>
                <span className="text-muted-foreground">Advance paid <b className="text-primary">{inr(Number(o.advance_amount))}</b></span>
                <Link to="/buyer/tracking" className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"><Package className="h-4 w-4" /> Track</Link>
              </div>
            </div>
          ))}
        </div>
      )}
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
