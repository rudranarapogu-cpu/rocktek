import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/onboarding")({
  head: () => ({ meta: [{ title: "Driver registration — RockTek Services" }] }),
  component: DriverOnboarding,
});

function DriverOnboarding() {
  const { user, loading, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [existing, setExisting] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", license_number: "", vehicle_number: "", vehicle_type: "", state: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth/login" });
    if (user) supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setExisting(data));
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = z.object({
      full_name: z.string().min(2).max(100),
      phone: z.string().min(7).max(20),
      license_number: z.string().min(3).max(40),
      vehicle_number: z.string().min(3).max(20),
    }).safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    const { error } = await supabase.from("drivers").insert({ user_id: user.id, ...form });
    if (error) { setSubmitting(false); return toast.error(error.message); }
    await supabase.from("user_roles").insert({ user_id: user.id, role: "driver" });
    await refreshRoles();
    setSubmitting(false);
    toast.success("Registration submitted for verification");
    nav({ to: "/driver" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary"><Truck className="h-4 w-4" /> Driver onboarding</div>
        <h1 className="mt-3 font-display text-4xl">Register as a verified driver</h1>
        <p className="mt-1 text-sm text-muted-foreground">After admin verification, sellers can assign you to granite loads.</p>

        {existing ? (
          <div className="mt-6 rounded-xl border border-accent bg-accent/10 p-5">
            <p className="font-display text-lg">Registration {existing.status}</p>
            <p className="text-sm text-muted-foreground">
              {existing.status === "approved" ? "You're verified! Head to your dashboard." : "Our team is reviewing your details."}
            </p>
            <Button className="mt-3 bg-primary" onClick={() => nav({ to: "/driver" })}>Go to driver dashboard</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <F label="Full name"><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></F>
            <F label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></F>
            <F label="Driving license number"><Input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} /></F>
            <F label="Vehicle number"><Input value={form.vehicle_number} onChange={(e) => set("vehicle_number", e.target.value)} placeholder="e.g. KA01AB1234" /></F>
            <F label="Vehicle type"><Input value={form.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)} placeholder="e.g. 10-wheeler truck" /></F>
            <F label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></F>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" disabled={submitting} className="w-full bg-primary">{submitting ? "Submitting…" : "Submit for verification"}</Button>
            </div>
          </form>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
