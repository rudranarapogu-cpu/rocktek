import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/seller/drivers")({
  component: SellerDrivers,
});

function SellerDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("drivers_public").select("id,full_name,vehicle_type,state").order("full_name").then(({ data }) => {
      setDrivers(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Seller</p>
      <h1 className="mt-1 font-display text-3xl">Verified Drivers</h1>
      <p className="mt-1 text-sm text-muted-foreground">Approved drivers available for assignment to your dispatches.</p>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : drivers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No approved drivers yet. Admin verifies driver registrations.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {drivers.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg">{d.full_name}</p>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{d.vehicle_type ?? "Truck"} · {d.state ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Contact details shared once assigned to your trip.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
