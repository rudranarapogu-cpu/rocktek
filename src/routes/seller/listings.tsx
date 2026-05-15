import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, MapPin, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/seller/listings")({
  component: SellerListings,
});

function SellerListings() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: s } = await supabase.from("sellers").select("id").eq("user_id", user.id).maybeSingle();
    if (!s) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("listings")
      .select("*,listing_images(url),categories(name)")
      .eq("seller_id", s.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const refresh = async (id: string) => {
    const expires = new Date(Date.now() + 7 * 86400000).toISOString();
    const { error } = await supabase.from("listings").update({ expires_at: expires, status: "active" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Listing refreshed for 7 days"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <h1 className="font-display text-3xl">My Listings</h1>
      {loading ? (
        <div className="mt-6 grid gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-2xl">No listings yet</p>
          <Button asChild className="mt-4"><Link to="/seller/upload">Upload your first</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((l) => {
            const expired = l.status !== "active" || new Date(l.expires_at).getTime() < Date.now();
            const daysLeft = Math.max(0, Math.ceil((new Date(l.expires_at).getTime() - Date.now()) / 86400000));
            return (
              <div key={l.id} className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center ${expired ? "border-border bg-muted/40" : "border-border bg-card"}`}>
                <div className="h-20 w-28 overflow-hidden rounded-md bg-muted">
                  {l.listing_images?.[0]?.url && <img src={l.listing_images[0].url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-primary">{l.categories?.name}</p>
                  <p className="truncate font-display text-lg">{l.title}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{l.state}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{expired ? "Expired" : `${daysLeft}d left`}</span>
                    <span>₹{Number(l.price).toLocaleString("en-IN")}/{l.unit_type}</span>
                    <span className="capitalize rounded bg-secondary/10 px-1.5">{l.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => refresh(l.id)}><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(l.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
