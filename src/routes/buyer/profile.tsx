import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/buyer/profile")({
  component: BuyerProfile,
});

function BuyerProfile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    if (user) supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Buyer</p>
      <h1 className="mt-1 font-display text-3xl">Profile</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card label="Name" value={profile?.full_name ?? "—"} />
        <Card label="Email" value={user?.email ?? "—"} />
        <Card label="Phone" value={profile?.phone ?? "—"} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link to="/auth/signup" search={{ role: "seller" }}>Become a seller</Link></Button>
        <Button asChild variant="outline"><Link to="/driver/onboarding">Become a driver</Link></Button>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}
function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg">{value}</p></div>;
}
