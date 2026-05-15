import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard } from "@/routes/index";
import { Search } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  state: z.string().optional(),
});

export const Route = createFileRoute("/marketplace")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Marketplace — Browse Granite & Stone | RockTek Services" },
      { name: "description", content: "Browse verified granite, marble, quartz and natural stone listings from approved sellers across India." },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("categories").select("id,name,slug").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from("listings")
      .select("id,title,price,quantity,unit_type,state,district,created_at,listing_images(url),categories!inner(name,slug),sellers(company_name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(60);
    if (search.q) q = q.ilike("title", `%${search.q}%`);
    if (search.state) q = q.eq("state", search.state);
    if (search.category) q = q.eq("categories.slug", search.category);
    q.then(({ data }) => { setListings(data ?? []); setLoading(false); });
  }, [search.q, search.state, search.category]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Marketplace</p>
            <h1 className="mt-1 font-display text-4xl">All Inventory</h1>
          </div>
          <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${listings.length} listings`}</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              defaultValue={search.q ?? ""}
              placeholder="Search title…"
              className="pl-9"
              onChange={(e) => navigate({ search: (s: any) => ({ ...s, q: e.target.value || undefined }), replace: true })}
            />
          </div>
          <Select value={search.category ?? "all"} onValueChange={(v) => navigate({ search: (s: any) => ({ ...s, category: v === "all" ? undefined : v }) })}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            defaultValue={search.state ?? ""}
            placeholder="Filter by state (e.g. Karnataka)"
            onChange={(e) => navigate({ search: (s: any) => ({ ...s, state: e.target.value || undefined }), replace: true })}
          />
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-2xl">No listings match</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or check back later.</p>
            <Link to="/marketplace" className="mt-4 inline-block text-primary underline">Reset filters</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => <ListingCard key={l.id} l={l} />)}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
