import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TRIP_STATUS_LABEL, type TripStatus } from "@/lib/logistics";

export const Route = createFileRoute("/driver/")({
  component: AssignedLoads,
});

function AssignedLoads() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: d } = await supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle();
      setDriver(d);
      if (d) {
        const { data } = await supabase
          .from("trips")
          .select("*,orders(buyer_name,delivery_address,quantity,listings(title,unit_type))")
          .eq("driver_id", d.id)
          .order("created_at", { ascending: false });
        setTrips(data ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Driver</p>
      <h1 className="mt-1 font-display text-3xl">Assigned Loads</h1>

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
          {trips.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{t.orders?.listings?.title}</p>
                  <p className="text-sm text-muted-foreground">{t.orders?.quantity} {t.orders?.listings?.unit_type} → {t.orders?.buyer_name}</p>
                  <p className="text-xs text-muted-foreground">{t.orders?.delivery_address}</p>
                </div>
                <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{TRIP_STATUS_LABEL[t.status as TripStatus]}</span>
              </div>
              <Link to="/driver/active" className="mt-3 inline-block text-sm text-primary hover:underline">Manage trip →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
