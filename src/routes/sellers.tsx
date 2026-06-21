import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, MapPin, Store } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sellers")({
  head: () => ({
    meta: [
      { title: "Verified Sellers — RockTek Services" },
      { name: "description", content: "Browse verified granite & stone sellers across India. Every seller on RockTek is document-verified before listing inventory." },
      { property: "og:title", content: "Verified Sellers — RockTek Services" },
      { property: "og:description", content: "Document-verified granite & stone suppliers across India." },
    ],
  }),
  component: Sellers,
});

interface Seller { id: string; company_name: string; owner_name: string | null; state: string | null; verified_at: string | null }

function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("sellers")
      .select("id,company_name,owner_name,state,verified_at")
      .eq("status", "approved")
      .order("company_name")
      .then(({ data }) => { setSellers((data as Seller[]) ?? []); setLoading(false); });
  }, []);

  const filtered = sellers.filter((s) =>
    s.company_name.toLowerCase().includes(q.toLowerCase()) ||
    (s.state ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Suppliers</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Verified Sellers</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Every seller is document-verified before they can list inventory.</p>

        <div className="mt-6 max-w-md">
          <Input placeholder="Search by company or state…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Store className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No verified sellers found yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                to="/marketplace"
                search={{ q: s.company_name }}
                className="group rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Store className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
                <h2 className="mt-3 font-display text-lg leading-tight">{s.company_name}</h2>
                {s.owner_name && <p className="text-sm text-muted-foreground">{s.owner_name}</p>}
                {s.state && (
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {s.state}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
