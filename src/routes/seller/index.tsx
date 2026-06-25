import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle2, AlertCircle, PlusCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/seller/")({
  component: SellerOverview,
});

function SellerOverview() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<any>(null);
  const [stats, setStats] = useState({ active: 0, expired: 0, sold: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
      setSeller(s);
      if (s) {
        const { data: l } = await supabase.from("listings").select("status").eq("seller_id", s.id);
        const counts = { active: 0, expired: 0, sold: 0 };
        (l ?? []).forEach((x) => { (counts as any)[x.status] = ((counts as any)[x.status] ?? 0) + 1; });
        setStats(counts);
      }
    })();
  }, [user]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl">Welcome back{seller ? `, ${seller.owner_name.split(" ")[0]}` : ""}</h1>
        </div>
        <Button asChild className="bg-primary"><Link to="/seller/upload"><PlusCircle className="mr-2 h-4 w-4" />Upload inventory</Link></Button>
      </div>

      {seller?.public_code && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">Your seller ID</span>
          <span className="font-mono font-semibold tracking-wide text-primary">{seller.public_code}</span>
        </div>
      )}

      {!seller ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-2xl">Complete your seller profile</p>
          <Button asChild className="mt-4"><Link to="/seller/onboarding">Start verification</Link></Button>
        </div>
      ) : seller.status !== "approved" ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent bg-accent/10 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 text-accent" />
          <div>
            <p className="font-display text-lg">Account pending verification</p>
            <p className="text-sm text-muted-foreground">Our team is reviewing your documents. You can browse the dashboard but cannot upload inventory until approved.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Verified seller</div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active listings" value={stats.active} icon={Package} accent />
        <Stat label="Expired" value={stats.expired} icon={Clock} />
        <Stat label="Sold" value={stats.sold} icon={CheckCircle2} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-5 shadow-sm ${accent ? "bg-secondary text-secondary-foreground" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs uppercase tracking-wider ${accent ? "text-accent" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-primary"}`} />
      </div>
      <p className="mt-3 font-display text-4xl">{value}</p>
    </div>
  );
}
