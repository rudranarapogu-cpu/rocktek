import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store, Truck, Boxes, ShoppingBag, Radar, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/logistics";

export const Route = createFileRoute("/admin/")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [sellers, drivers, listings, orders, trips] = await Promise.all([
        supabase.from("sellers").select("status"),
        supabase.from("drivers").select("status"),
        supabase.from("listings").select("status"),
        supabase.from("orders").select("total_amount,advance_amount,status"),
        supabase.from("trips").select("status"),
      ]);
      const o = orders.data ?? [];
      setStats({
        sellersTotal: sellers.data?.length ?? 0,
        sellersPending: (sellers.data ?? []).filter((x) => x.status === "pending").length,
        driversTotal: drivers.data?.length ?? 0,
        driversPending: (drivers.data ?? []).filter((x) => x.status === "pending").length,
        listingsActive: (listings.data ?? []).filter((x) => x.status === "active").length,
        listingsSold: (listings.data ?? []).filter((x) => x.status === "sold").length,
        ordersTotal: o.length,
        gmv: o.reduce((s, x) => s + Number(x.total_amount), 0),
        advance: o.reduce((s, x) => s + Number(x.advance_amount), 0),
        activeTrips: (trips.data ?? []).filter((x) => x.status !== "delivered").length,
        delivered: (trips.data ?? []).filter((x) => x.status === "delivered").length,
      });
    })();
  }, []);

  if (!stats) return <div className="h-48 animate-pulse rounded-xl bg-muted" />;

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Admin</p>
      <h1 className="mt-1 font-display text-3xl">Platform Analytics</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Store} label="Sellers" value={stats.sellersTotal} sub={`${stats.sellersPending} pending`} />
        <Stat icon={Truck} label="Drivers" value={stats.driversTotal} sub={`${stats.driversPending} pending`} />
        <Stat icon={Boxes} label="Active inventory" value={stats.listingsActive} sub={`${stats.listingsSold} sold out`} />
        <Stat icon={ShoppingBag} label="Orders" value={stats.ordersTotal} sub={`GMV ${inr(stats.gmv)}`} accent />
        <Stat icon={Radar} label="Active shipments" value={stats.activeTrips} sub={`${stats.delivered} delivered`} />
        <Stat icon={CheckCircle2} label="Advance collected" value={inr(stats.advance)} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: any; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-5 shadow-sm ${accent ? "bg-secondary text-secondary-foreground" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs uppercase tracking-wider ${accent ? "text-accent" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-primary"}`} />
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {sub && <p className={`mt-1 text-xs ${accent ? "text-accent" : "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
}
