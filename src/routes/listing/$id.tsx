import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Package, ShieldCheck, Clock, Hammer, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("listings")
      .select("*,listing_images(url,position),listing_videos(url),categories(name,slug),sellers(company_name,owner_name,state)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => { setListing(data); setLoading(false); });
  }, [id]);

  if (loading) return <PageShell><div className="h-96 animate-pulse rounded-xl bg-muted" /></PageShell>;
  if (!listing) return <PageShell><p>Listing not found.</p></PageShell>;

  const images: { url: string }[] = listing.listing_images ?? [];
  const expiresIn = Math.max(0, Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / 86400000));

  const handleBookNow = () => {
    if (!user) {
      toast.info("Please log in to book.");
      return;
    }
    toast.success("Booking flow coming in Phase 2");
  };

  return (
    <PageShell>
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
            {images[activeImg]?.url ? (
              <img src={images[activeImg].url} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center granite-texture text-muted-foreground"><Hammer className="h-12 w-12" /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((im, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden rounded-md border ${i === activeImg ? "border-primary" : "border-border"}`}>
                  <img src={im.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground">
            <ShieldCheck className="h-3 w-3 text-accent" /> Verified Seller
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary">{listing.categories?.name}</p>
          <h1 className="mt-1 font-display text-4xl">{listing.title}</h1>
          <p className="mt-3 text-muted-foreground">{listing.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Spec icon={MapPin} label="Location" value={`${listing.district ?? ""} ${listing.state}`.trim()} />
            <Spec icon={Package} label="Available" value={`${listing.stock_available} ${listing.unit_type}`} />
            <Spec icon={Hammer} label="Finish" value={listing.finish_type ?? "—"} />
            <Spec icon={Building2} label="Dimensions" value={listing.dimensions ?? "—"} />
            <Spec icon={ShieldCheck} label="Shading" value={listing.shading_quality ?? "—"} />
            <Spec icon={Clock} label="Expires in" value={`${expiresIn} day${expiresIn === 1 ? "" : "s"}`} />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Price</p>
                <p className="font-display text-4xl">₹{Number(listing.price).toLocaleString("en-IN")}<span className="text-base text-muted-foreground">/{listing.unit_type}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-muted-foreground">1% advance only</p>
                <p className="font-display text-xl text-primary">₹{Math.round(Number(listing.price) * 0.01).toLocaleString("en-IN")}</p>
              </div>
            </div>
            <Button onClick={handleBookNow} size="lg" className="mt-4 w-full bg-primary">Book Now</Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">RockTek mediates the full transaction. Pay 1% to lock the order.</p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-secondary/5 p-4 text-sm">
            <p className="font-display text-base">Sold by</p>
            <p className="mt-1 font-semibold">{listing.sellers?.company_name}</p>
            <p className="text-muted-foreground">{listing.sellers?.owner_name} · {listing.sellers?.state}</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Spec({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">{children}</div>
      <SiteFooter />
    </div>
  );
}
