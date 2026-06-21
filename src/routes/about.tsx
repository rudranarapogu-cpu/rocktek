import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Truck, Boxes, Handshake } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — RockTek Services | Verified Granite Marketplace" },
      { name: "description", content: "RockTek Services connects verified granite & stone sellers with buyers across India, with real-time load tracking and mediated trust." },
      { property: "og:title", content: "About RockTek Services" },
      { property: "og:description", content: "India's verified B2B granite & stone marketplace with real-time logistics." },
    ],
  }),
  component: About,
});

const values = [
  { icon: ShieldCheck, title: "Verified Supply", text: "Every seller and driver is document-verified before they transact." },
  { icon: Boxes, title: "Inventory-First", text: "Live stock from quarries and processing units, updated in real time." },
  { icon: Truck, title: "Tracked Logistics", text: "Real-time GPS tracking on every confirmed booking, end to end." },
  { icon: Handshake, title: "Mediated Trust", text: "Book with a small advance — RockTek mediates the rest." },
];

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">About</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Moving stone, faster and safer</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          RockTek Services is a verified granite, marble and natural-stone marketplace built for
          India's B2B stone trade. We bring quarry sellers, buyers and logistics drivers onto a
          single platform — with verification, live inventory and real-time shipment tracking.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl">{v.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
