import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — RockTek Services" },
      { name: "description", content: "Get in touch with the RockTek Services team for sales, support, seller onboarding and logistics enquiries." },
      { property: "og:title", content: "Contact RockTek Services" },
      { property: "og:description", content: "Reach the RockTek team for sales, support and onboarding." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Contact</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Talk to RockTek</h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <ContactRow icon={Mail} label="Email" value="hello@rocktek.services" />
            <ContactRow icon={Phone} label="Phone" value="+91 90000 00000" />
            <ContactRow icon={MapPin} label="Office" value="Hyderabad, Telangana, India" />
          </div>

          <form
            className="space-y-4 rounded-2xl border border-border bg-card p-6"
            onSubmit={(e) => { e.preventDefault(); setSent(true); toast.success("Message sent — we'll be in touch."); }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input required placeholder="Your name" />
              <Input required type="email" placeholder="Email" />
            </div>
            <Input placeholder="Subject" />
            <Textarea required placeholder="How can we help?" rows={5} />
            <Button type="submit" className="w-full" disabled={sent}>{sent ? "Sent" : "Send message"}</Button>
          </form>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}
