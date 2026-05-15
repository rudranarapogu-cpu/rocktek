import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Search, ShieldCheck, Truck, Hammer, MapPin, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-granite.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RockTek Services — Verified Granite & Stone Marketplace" },
      { name: "description", content: "Browse thousands of verified granite, marble, and natural stone listings from approved Indian sellers. Book with just 1% advance." },
    ],
  }),
  component: HomePage,
});

interface Category { id: string; name: string; slug: string; description: string | null }
interface Listing {
  id: string; title: string; price: number; quantity: number; unit_type: string;
  state: string; district: string | null; created_at: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
  sellers: { company_name: string } | null;
}

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data ?? []));
    supabase
      .from("listings")
      .select("id,title,price,quantity,unit_type,state,district,created_at,listing_images(url),categories(name),sellers(company_name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setListings((data as any) ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero text-white">
        <div className="absolute inset-0 opacity-30">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              India's verified granite marketplace
            </div>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
              QUARRY TO PROJECT.<br />
              <span className="text-flame">MEDIATED. VERIFIED.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
              Book inventory directly from approved sellers across India. Pay just <strong className="text-accent">1% advance</strong>. RockTek handles the rest.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); }}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-xl bg-white p-2 shadow-industrial"
            >
              <div className="flex flex-1 items-center gap-2 px-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search granite, marble, quartz…"
                  className="border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
              <Button asChild size="sm" className="bg-primary">
                <Link to="/marketplace" search={{ q: search }}>Search</Link>
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" /> Verified sellers</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-accent" /> Pan-India delivery</span>
              <span className="inline-flex items-center gap-1.5"><Hammer className="h-4 w-4 text-accent" /> Direct from quarries</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <SectionHeader eyebrow="Categories" title="Browse by stone type" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-secondary text-secondary-foreground shadow-industrial transition-transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 granite-texture opacity-30" />
              <div className={`absolute inset-x-0 bottom-0 h-1/2 ${i % 2 === 0 ? "bg-flame" : "bg-gradient-to-t from-secondary to-transparent"} opacity-${i % 2 === 0 ? "20" : "100"}`} />
              <div className="relative flex h-full flex-col justify-end p-4">
                <span className="font-display text-xl leading-tight sm:text-2xl">{c.name}</span>
                <span className="mt-1 inline-flex items-center text-xs text-secondary-foreground/70 group-hover:text-accent">
                  Explore <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* LATEST INVENTORY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between">
          <SectionHeader eyebrow="Fresh inventory" title="Latest listings" />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/marketplace">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        {listings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => <ListingCard key={l.id} l={l} />)}
          </div>
        )}
      </section>

      {/* SELLER CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="relative overflow-hidden rounded-2xl bg-secondary p-8 text-secondary-foreground shadow-industrial md:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-accent">For Sellers</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">List your inventory. Reach verified buyers.</h2>
              <p className="mt-3 text-secondary-foreground/80">
                Upload your stock in minutes. Listings are valid for 7 days and shown to thousands of vetted buyers across India.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground">
                <Link to="/auth/signup" search={{ role: "seller" }}>Become a verified seller <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground">
                <Link to="/sell">How it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl sm:text-4xl">{title}</h2>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <p className="font-display text-xl">No listings yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Verified sellers are uploading inventory. Check back soon.</p>
      <Button asChild className="mt-5">
        <Link to="/auth/signup" search={{ role: "seller" }}>Become a seller</Link>
      </Button>
    </div>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  const img = l.listing_images?.[0]?.url;
  return (
    <Link
      to="/listing/$id"
      params={{ id: l.id }}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-industrial hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          <img src={img} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center granite-texture text-muted-foreground"><Hammer className="h-8 w-8" /></div>
        )}
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-secondary/90 px-2 py-1 text-[10px] font-semibold text-secondary-foreground backdrop-blur">
          <ShieldCheck className="h-3 w-3 text-accent" /> Verified
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{l.categories?.name ?? "Stone"}</p>
        <h3 className="mt-1 line-clamp-1 font-display text-lg leading-tight">{l.title}</h3>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{l.district ?? l.state}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />New</span>
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-border pt-2">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Price</p>
            <p className="font-display text-lg leading-none">₹{Number(l.price).toLocaleString("en-IN")}<span className="text-xs text-muted-foreground">/{l.unit_type}</span></p>
          </div>
          <span className="text-[10px] text-muted-foreground">{l.quantity} {l.unit_type} avail.</span>
        </div>
      </div>
    </Link>
  );
}
