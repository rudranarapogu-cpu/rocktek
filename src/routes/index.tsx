import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Truck, MapPin, Hammer, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RockTek Services — Verified Granite & Stone Marketplace" },
      { name: "description", content: "Source granite, marble and natural stone directly from verified factories across India. District-level delivery with live GPS tracking." },
    ],
  }),
  component: HomePage,
});

interface Category { id: string; name: string; slug: string; description: string | null }
interface Listing {
  id: string; title: string; price: number; quantity: number; unit_type: string;
  state: string; district: string | null; created_at: string;
  finish_type: string | null; dimensions: string | null;
  listing_images: { url: string }[];
  categories: { name: string } | null;
}

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [fDistrict, setFDistrict] = useState("");
  const [fFinish, setFFinish] = useState("all");
  const [fMax, setFMax] = useState("");

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data ?? []));
    supabase
      .from("listings")
      .select("id,title,price,quantity,unit_type,state,district,finish_type,dimensions,created_at,listing_images(url),categories(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => setListings((data as any) ?? []));
  }, []);

  const finishes = useMemo(
    () => [...new Set(listings.map((l) => l.finish_type).filter(Boolean) as string[])],
    [listings],
  );

  const filtered = useMemo(() => listings.filter((l) => {
    if (fDistrict && !(l.district ?? l.state ?? "").toLowerCase().includes(fDistrict.toLowerCase())) return false;
    if (fFinish !== "all" && l.finish_type !== fFinish) return false;
    if (fMax && Number(l.price) > Number(fMax)) return false;
    return true;
  }), [listings, fDistrict, fFinish, fMax]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* COMPACT INTRO + TRUST SIGNALS (no promo hero) */}
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="max-w-3xl font-display text-3xl leading-tight sm:text-4xl">
            Source granite &amp; stone directly from verified factories.
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            RockTek connects contractors and buyers with approved stone factories — district-level delivery, transparent pricing, live tracking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrustSignal icon={ShieldCheck} label="Verified Factories" note="Documents manually reviewed" />
            <TrustSignal icon={MapPin} label="Districts Covered" note="Local sourcing first" />
            <TrustSignal icon={Truck} label="GPS-Tracked Delivery" note="Live location on every trip" />
          </div>
        </div>
      </section>

      {/* STONE-TYPE CARDS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeader eyebrow="Browse" title="Stone types" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/marketplace"
              search={{ category: c.slug } as any}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary text-secondary-foreground transition-transform hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 granite-texture opacity-30" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-secondary to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-4">
                <span className="font-display text-xl leading-tight">{c.name}</span>
                <span className="mt-1 inline-flex items-center text-xs text-secondary-foreground/70 group-hover:text-accent">
                  View listings <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FILTERABLE LIVE LISTINGS */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeader eyebrow="Live inventory" title="Current listings" />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/marketplace">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Input value={fDistrict} onChange={(e) => setFDistrict(e.target.value)} placeholder="Filter by district" />
          <Select value={fFinish} onValueChange={setFFinish}>
            <SelectTrigger><SelectValue placeholder="Finish" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All finishes</SelectItem>
              {finishes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={fMax} onChange={(e) => setFMax(e.target.value)} placeholder="Max price ₹" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((l) => <ListingCard key={l.id} l={l} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function TrustSignal({ icon: Icon, label, note }: { icon: any; label: string; note: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl">{title}</h2>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <p className="font-display text-xl">No listings match</p>
      <p className="mt-1 text-sm text-muted-foreground">Try widening your filters or browse the full marketplace.</p>
      <Button asChild className="mt-5"><Link to="/marketplace">Open marketplace</Link></Button>
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
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 granite-texture text-muted-foreground">
            <Hammer className="h-7 w-7" />
            <span className="text-[10px] uppercase tracking-wider">Photos pending</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{l.categories?.name ?? "Stone"}</p>
        <h3 className="mt-1 line-clamp-1 font-display text-lg leading-tight">{l.title}</h3>
        {(l.finish_type || l.dimensions) && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            {[l.finish_type, l.dimensions].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{l.district ?? l.state}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />New</span>
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-border pt-2">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Price / {l.unit_type}</p>
            <p className="font-display text-lg leading-none">₹{Number(l.price).toLocaleString("en-IN")}<span className="text-xs text-muted-foreground">/{l.unit_type}</span></p>
          </div>
          <span className="text-[10px] text-muted-foreground">{l.quantity} {l.unit_type} avail.</span>
        </div>
      </div>
    </Link>
  );
}
