import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard } from "@/routes/index";

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      setCat(c);
      if (c) {
        const { data } = await supabase
          .from("listings")
          .select("id,title,price,quantity,unit_type,state,district,created_at,listing_images(url),categories(name),sellers(company_name)")
          .eq("status", "active")
          .eq("category_id", c.id)
          .order("created_at", { ascending: false });
        setListings(data ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <Link to="/categories" className="text-xs uppercase tracking-widest text-accent">← All categories</Link>
          <h1 className="mt-3 font-display text-5xl">{cat?.name ?? slug}</h1>
          <p className="mt-2 max-w-2xl text-white/80">{cat?.description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-2xl">No active inventory in this category</p>
            <p className="mt-1 text-sm text-muted-foreground">New listings appear here as sellers upload.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => <ListingCard key={l.id} l={l} />)}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
