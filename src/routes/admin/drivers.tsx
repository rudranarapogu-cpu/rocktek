import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/drivers")({
  component: AdminDrivers,
});

function AdminDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => supabase.from("drivers").select("*").order("created_at", { ascending: false }).then(({ data }) => { setDrivers(data ?? []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const decide = async (d: any, status: "approved" | "rejected") => {
    const { error } = await supabase.from("drivers").update({ status, verified_at: status === "approved" ? new Date().toISOString() : null }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success(`Driver ${status}`);
    load();
  };

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Admin</p>
      <h1 className="mt-1 font-display text-3xl">Driver Verification</h1>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : drivers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No driver registrations yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {drivers.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{d.full_name}</p>
                  <p className="text-sm text-muted-foreground">{d.vehicle_type ?? "Truck"} · {d.vehicle_number} · {d.state ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">License: {d.license_number} · {d.phone}</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${d.status === "approved" ? "bg-accent/20 text-accent-foreground" : d.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-secondary text-secondary-foreground"}`}>{d.status}</span>
              </div>
              {d.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="bg-primary" onClick={() => decide(d, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decide(d, "rejected")}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
