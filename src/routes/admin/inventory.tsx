import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/logistics";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventory,
});

function AdminInventory() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => supabase
    .from("listings")
    .select("*,sellers(company_name),categories(name)")
    .order("created_at", { ascending: false })
    .then(({ data }) => { setListings(data ?? []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "active" | "expired") => {
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "expired" ? "Listing removed from marketplace" : "Listing restored");
    load();
  };

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Admin</p>
      <h1 className="mt-1 font-display text-3xl">Inventory Moderation</h1>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : listings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No listings yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{l.title}</p>
                  <p className="text-sm text-muted-foreground">{l.sellers?.company_name} · {l.categories?.name}</p>
                  <p className="text-xs text-muted-foreground">{inr(Number(l.price))}/{l.unit_type} · stock {l.stock_available} {l.unit_type}</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${l.status === "active" ? "bg-accent/20 text-accent-foreground" : l.status === "sold" ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`}>{l.status}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {l.status !== "expired" ? (
                  <Button size="sm" variant="outline" onClick={() => setStatus(l.id, "expired")}>Remove from marketplace</Button>
                ) : (
                  <Button size="sm" className="bg-primary" onClick={() => setStatus(l.id, "active")}>Restore</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
