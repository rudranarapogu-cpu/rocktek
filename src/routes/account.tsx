import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  component: Account,
});

function Account() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    if (user) supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  if (!user) return (
    <Shell><div className="rounded-xl border border-border p-8 text-center"><p>Please <Link to="/auth/login" className="text-primary underline">sign in</Link>.</p></div></Shell>
  );

  return (
    <Shell>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Account</p>
      <h1 className="mt-1 font-display text-4xl">My Account</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card label="Name" value={profile?.full_name ?? "—"} />
        <Card label="Email" value={user.email ?? "—"} />
        <Card label="Phone" value={profile?.phone ?? "—"} />
      </div>
      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline"><Link to="/auth/signup" search={{ role: "seller" }}>Become a seller</Link></Button>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </Shell>
  );
}
function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg">{value}</p></div>;
}
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background"><SiteHeader /><div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">{children}</div><SiteFooter /></div>;
}
