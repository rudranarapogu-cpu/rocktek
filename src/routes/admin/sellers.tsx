import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sellers")({
  component: AdminSellers,
});

function AdminSellers() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => supabase.from("sellers").select("*").order("created_at", { ascending: false }).then(({ data }) => { setSellers(data ?? []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const decide = async (s: any, status: "approved" | "rejected") => {
    const { error } = await supabase.from("sellers").update({ status, verified_at: status === "approved" ? new Date().toISOString() : null }).eq("id", s.id);
    if (error) return toast.error(error.message);
    if (status === "approved") {
      await supabase.from("user_roles").upsert({ user_id: s.user_id, role: "seller" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    }
    toast.success(`Seller ${status}`);
    load();
  };

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Admin</p>
      <h1 className="mt-1 font-display text-3xl">Seller Verification</h1>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : sellers.length === 0 ? (
        <Empty />
      ) : (
        <div className="mt-6 space-y-3">
          {sellers.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{s.company_name}</p>
                  <p className="text-sm text-muted-foreground">{s.owner_name} · {s.state} · {s.phone}</p>
                  <p className="text-xs text-muted-foreground">GST: {s.gst_number} — {s.gst_address}</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${s.status === "approved" ? "bg-accent/20 text-accent-foreground" : s.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-secondary text-secondary-foreground"}`}>{s.status}</span>
              </div>
              {s.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="bg-primary" onClick={() => decide(s, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decide(s, "rejected")}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <Store className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">No seller applications yet.</p>
    </div>
  );
}
