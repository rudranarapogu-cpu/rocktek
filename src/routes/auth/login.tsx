import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — RockTek Services" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse({ email, password });
    if (!parsed.success) return toast.error("Invalid credentials");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav({ to: "/" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to manage bookings or your seller dashboard.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <Button type="submit" disabled={loading} className="w-full bg-primary">{loading ? "Signing in…" : "Sign in"}</Button>
    </form>
    <Divider />
    <Button variant="outline" onClick={google} className="w-full">Continue with Google</Button>
    <p className="mt-6 text-center text-sm text-muted-foreground">No account? <Link to="/auth/signup" className="text-primary underline">Create one</Link></p>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden bg-hero p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Mountain className="h-5 w-5" /></span>
          <span className="font-display text-2xl">ROCK<span className="text-flame">TEK</span></span>
        </Link>
        <div>
          <h2 className="font-display text-5xl leading-tight">India's verified<br /><span className="text-flame">granite marketplace</span></h2>
          <p className="mt-4 max-w-md text-white/70">Vetted sellers. Mediated trust. 1% advance bookings. Built for the modern stone industry.</p>
        </div>
        <p className="text-xs text-white/50">© RockTek Services</p>
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Mountain className="h-4 w-4" /></span>
            <span className="font-display text-xl">ROCK<span className="text-flame">TEK</span></span>
          </Link>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Divider() {
  return <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>;
}
