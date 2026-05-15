import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { AuthShell } from "@/routes/auth/login";

export const Route = createFileRoute("/auth/signup")({
  validateSearch: z.object({ role: z.enum(["buyer", "seller"]).optional() }),
  head: () => ({ meta: [{ title: "Sign up — RockTek Services" }] }),
  component: Signup,
});

function Signup() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const role = search.role ?? "buyer";

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({
      full_name: z.string().min(2).max(100),
      email: z.string().email(),
      phone: z.string().min(7).max(20),
      password: z.string().min(8).max(72),
    }).safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.full_name, phone: form.phone },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Add seller role if requested
    if (role === "seller" && data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: "seller" });
    }
    setLoading(false);
    toast.success("Account created");
    nav({ to: role === "seller" ? "/seller/onboarding" : "/" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-up failed");
  };

  return (
    <AuthShell
      title={role === "seller" ? "Become a verified seller" : "Create your account"}
      subtitle={role === "seller" ? "After signup, complete your business verification." : "Browse without an account. Sign up only to book."}
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full name"><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></Field>
        <Field label="Password"><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} /></Field>
        <Button type="submit" disabled={loading} className="w-full bg-primary">{loading ? "Creating…" : "Create account"}</Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
      <Button variant="outline" onClick={google} className="w-full">Continue with Google</Button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/auth/login" className="text-primary underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
