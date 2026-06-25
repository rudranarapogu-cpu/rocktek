import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TRIP_STATUS_LABEL, type TripStatus } from "@/lib/logistics";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/")({
  component: AssignedLoads,
});

function AssignedLoads() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async (driverId: string) => {
    const { data } = await supabase
      .from("trips")
      .select("*,orders(buyer_name,delivery_address,quantity,listings(title,unit_type))")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });
    setTrips(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: d } = await supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle();
      setDriver(d);
      if (d) await load(d.id);
      setLoading(false);
    })();
  }, [user]);

  const respond = async (trip: any, accept: boolean) => {
    setBusy(trip.id);
    const patch = accept
      ? { acceptance: "accepted", accepted_at: new Date().toISOString() }
      : { acceptance: "rejected", rejected_at: new Date().toISOString() };
    const { error } = await supabase.from("trips").update(patch).eq("id", trip.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    if (!accept) {
      // free the order so the seller can reassign
      await supabase.from("orders").update({ status: "confirmed" }).eq("id", trip.order_id);
    }
    toast.success(accept ? "Trip accepted" : "Trip rejected");
    if (driver) load(driver.id);
  };

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Driver</p>
      <h1 className="mt-1 font-display text-3xl">Assigned Loads</h1>

      {driver?.public_code && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">Your driver ID</span>
          <span className="font-mono font-semibold tracking-wide text-primary">{driver.public_code}</span>
        </div>
      )}

      {driver && driver.status !== "approved" && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent bg-accent/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 text-accent" />
          <p>Your driver account is <b>{driver.status}</b>. You can be assigned loads once an admin approves you.</p>
        </div>
      )}

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No loads assigned yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {trips.map((t) => {
            const pending = t.acceptance === "pending";
            const rejected = t.acceptance === "rejected";
            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg">{t.orders?.listings?.title}</p>
                    <p className="text-sm text-muted-foreground">{t.orders?.quantity} {t.orders?.listings?.unit_type} → {t.orders?.buyer_name}</p>
                    <p className="text-xs text-muted-foreground">{t.orders?.delivery_address}</p>
                  </div>
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    pending ? "bg-accent/15 text-accent" : rejected ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                  }`}>
                    {pending ? "Awaiting your response" : rejected ? "Rejected" : TRIP_STATUS_LABEL[t.status as TripStatus]}
                  </span>
                </div>

                {pending ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="bg-primary" disabled={busy === t.id} onClick={() => respond(t, true)}>
                      <Check className="mr-1 h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => respond(t, false)}>
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                ) : rejected ? (
                  <p className="mt-3 text-sm text-muted-foreground">You rejected this trip. The seller can reassign it.</p>
                ) : (
                  <Link to="/driver/active" className="mt-3 inline-block text-sm text-primary hover:underline">Manage trip →</Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
