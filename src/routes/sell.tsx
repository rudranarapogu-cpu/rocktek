import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Upload, Eye, Truck, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sell")({
  head: () => ({ meta: [
    { title: "Sell on RockTek — Verified Granite Marketplace" },
    { name: "description", content: "Become a verified granite seller on RockTek. List your inventory, reach vetted buyers across India." },
  ]}),
  component: SellPage,
});

const steps = [
  { icon: ShieldCheck, title: "Apply for verification", body: "Submit your GST, business address, and 2–3 invoices for review." },
  { icon: Upload, title: "Upload inventory", body: "Add granite & stone listings with photos, dimensions and stock." },
  { icon: Eye, title: "Get discovered", body: "Verified buyers across India browse fresh listings every day." },
  { icon: Truck, title: "RockTek mediates", body: "We handle buyer trust, advance payments and dispatch coordination." },
];

function SellPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-accent">For Sellers</p>
          <h1 className="mt-2 font-display text-5xl md:text-6xl max-w-3xl">Move stone faster. <span className="text-flame">Sell smarter.</span></h1>
          <p className="mt-4 max-w-xl text-white/80">Join India's verified B2B granite marketplace. Direct access to vetted project buyers.</p>
          <Button asChild size="lg" className="mt-8 bg-primary"><Link to="/auth/signup" search={{ role: "seller" }}>Start verification <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="font-display text-5xl text-primary/20 absolute right-4 top-2">0{i+1}</div>
              <s.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
