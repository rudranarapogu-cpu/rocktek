import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Package, ShieldCheck, Clock, Hammer, Building2, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ADVANCE_RATE, inr } from "@/lib/logistics";
import { toast } from "sonner";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    supabase
      .from("listings")
      .select("*,listing_images(url,position),listing_videos(url),categories(name,slug)")
      .eq("id", id)
      .maybeSingle()
      .then(async ({ data }) => {
        setListing(data);
        if (data?.seller_id) {
          const { data: s } = await supabase
            .from("sellers_public")
            .select("company_name,owner_name,state")
            .eq("id", data.seller_id)
            .maybeSingle();
          setSeller(s);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageShell><div className="h-96 animate-pulse rounded-xl bg-muted" /></PageShell>;
  if (!listing) return <PageShell><p>Listing not found.</p></PageShell>;

  const images: { url: string }[] = listing.listing_images ?? [];
  const expiresIn = Math.max(0, Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / 86400000));
  const soldOut = listing.status === "sold" || Number(listing.stock_available) <= 0;

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
                <p className="font-display text-4xl">{inr(Number(listing.price))}<span className="text-base text-muted-foreground">/{listing.unit_type}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-muted-foreground">1% advance only</p>
                <p className="font-display text-xl text-primary">{inr(Number(listing.price) * ADVANCE_RATE)}</p>
              </div>
            </div>
            {soldOut ? (
              <Button disabled size="lg" className="mt-4 w-full">Sold out</Button>
            ) : (
              <Button onClick={() => setBooking(true)} size="lg" className="mt-4 w-full bg-primary">Book Now</Button>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">RockTek mediates the full transaction. Pay 1% to lock the order.</p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-secondary/5 p-4 text-sm">
            <p className="font-display text-base">Sold by</p>
            <p className="mt-1 font-semibold">{seller?.company_name ?? "Verified seller"}</p>
            <p className="text-muted-foreground">{[seller?.owner_name, seller?.state].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </div>

      {booking && <BookingDialog listing={listing} user={user} onClose={() => setBooking(false)} />}
    </PageShell>
  );
}

function BookingDialog({ listing, user, onClose }: { listing: any; user: any; onClose: () => void }) {
  const nav = useNavigate();
  const [qty, setQty] = useState("1");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const stock = Number(listing.stock_available);
  const quantity = Math.max(0, Number(qty) || 0);
  const total = quantity * Number(listing.price);
  const advance = total * ADVANCE_RATE;

  const confirm = async () => {
    if (!user) { toast.info("Please sign in to book."); nav({ to: "/auth/login" }); return; }
    if (quantity <= 0) return toast.error("Enter a valid quantity");
    if (quantity > stock) return toast.error(`Only ${stock} ${listing.unit_type} available`);
    if (!name || !phone || !address) return toast.error("Fill in your contact & delivery details");

    setSubmitting(true);
    // Mock payment: assume 1% advance succeeds, mark order confirmed (stock auto-reduces via DB trigger).
    const { error } = await supabase.from("orders").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      quantity,
      unit_price: Number(listing.price),
      total_amount: total,
      advance_amount: advance,
      status: "confirmed",
      payment_status: "advance_paid",
      buyer_name: name,
      buyer_phone: phone,
      delivery_address: address,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Booking confirmed! Advance paid.");
    nav({ to: "/buyer" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Booking</p>
            <h2 className="mt-1 font-display text-2xl">{listing.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 space-y-3">
          <F label={`Quantity (${listing.unit_type}) — max ${stock}`}>
            <Input type="number" min="1" max={stock} value={qty} onChange={(e) => setQty(e.target.value)} />
          </F>
          <F label="Your name"><Input value={name} onChange={(e) => setName(e.target.value)} /></F>
          <F label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></F>
          <F label="Delivery address"><Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></F>
        </div>

        <div className="mt-4 space-y-1 rounded-xl bg-muted p-4 text-sm">
          <Row label="Order total" value={inr(total)} />
          <Row label="Advance now (1%)" value={inr(advance)} highlight />
          <Row label="Balance on delivery" value={inr(total - advance)} muted />
        </div>

        <Button onClick={confirm} disabled={submitting} size="lg" className="mt-4 w-full bg-primary">
          {submitting ? "Processing payment…" : `Pay ${inr(advance)} & confirm`}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Mock payment for demo. Stock reduces automatically.</p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`font-semibold ${highlight ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
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
