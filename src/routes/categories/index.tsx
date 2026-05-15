import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Categories — Granite, Marble, Quartz & More | RockTek Services" },
      { name: "description", content: "Browse stone categories: black granite, white granite, marble, quartz, and natural stone." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCats(data ?? []));
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Catalog</p>
        <h1 className="mt-1 font-display text-4xl">Stone Categories</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Pick a category to see all verified inventory from approved sellers.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, i) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-secondary p-8 text-secondary-foreground shadow-industrial transition-transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 granite-texture opacity-20" />
              <div className={`absolute -right-10 -bottom-10 h-44 w-44 rounded-full blur-3xl ${i % 2 === 0 ? "bg-primary/40" : "bg-accent/30"}`} />
              <div className="relative">
                <p className="font-display text-xs uppercase tracking-widest text-accent">Category</p>
                <h2 className="mt-2 font-display text-3xl leading-tight">{c.name}</h2>
                <p className="mt-2 text-sm text-secondary-foreground/70 line-clamp-2">{c.description}</p>
                <span className="mt-6 inline-flex items-center text-sm text-accent">Browse listings <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
