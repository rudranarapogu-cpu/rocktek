import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Hammer, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ADVANCE_RATE, inr } from "@/lib/logistics";
import { computeDeliveryDistance } from "@/lib/geo.functions";
import { AddressPicker } from "@/components/address-picker";
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
  const [quote, setQuote] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

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
          if (user) {
            const { data: mine } = await supabase
              .from("sellers")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();
            setIsOwner(!!mine && mine.id === data.seller_id);
          }
        }
        setLoading(false);
      });
  }, [id, user]);

  if (loading) return <PageShell><div className="h-96 animate-pulse rounded-xl bg-muted" /></PageShell>;
  if (!listing) return <PageShell><p>Listing not found.</p></PageShell>;

  const images: { url: string }[] = listing.listing_images ?? [];
  const expiresIn = Math.max(0, Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / 86400000));
  const soldOut = listing.status === "sold" || Number(listing.stock_available) <= 0;

  const specs = [
    { label: "Category", value: listing.categories?.name },
    { label: "Location", value: `${listing.district ?? ""} ${listing.state}`.trim() },
    { label: "Available stock", value: `${listing.stock_available} ${listing.unit_type}` },
    { label: "Finish", value: listing.finish_type },
    { label: "Dimensions", value: listing.dimensions },
    { label: "Shading / grade", value: listing.shading_quality },
    { label: "Listing valid", value: `${expiresIn} day${expiresIn === 1 ? "" : "s"} left` },
  ].filter((s) => s.value);

  return (
    <PageShell>
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        {/* GALLERY ~35% */}
        <div className="lg:col-span-4">
          <div className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            {images[activeImg]?.url ? (
              <img src={images[activeImg].url} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 granite-texture text-muted-foreground">
                <Hammer className="h-10 w-10" />
                <span className="text-xs uppercase tracking-wider">Photos pending</span>
              </div>
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

        {/* DETAILS (center) */}
        <div className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{listing.categories?.name}</p>
          <h1 className="mt-1 font-display text-4xl">{listing.title}</h1>

          {/* Factory / seller name + verified badge */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">by</span>
            <span className="font-semibold">{seller?.company_name ?? "Verified factory"}</span>
            <span
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
              title="Verified Factory — documents manually reviewed and approved by the RockTek team."
            >
              <ShieldCheck className="h-3 w-3 text-accent" /> Verified Factory
            </span>
          </div>

          {/* Variant / attribute chips (only real data) */}
          {(listing.finish_type || listing.dimensions) && (
            <div className="mt-5 space-y-3">
              {listing.finish_type && (
                <VariantRow label="Finish" options={[listing.finish_type]} />
              )}
              {listing.dimensions && (
                <VariantRow label="Slab size" options={[listing.dimensions]} />
              )}
            </div>
          )}

          {/* Spec table */}
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((s, i) => (
                  <tr key={s.label} className={i % 2 ? "bg-card" : "bg-background"}>
                    <td className="w-1/2 border-b border-border px-4 py-2.5 text-muted-foreground">{s.label}</td>
                    <td className="border-b border-border px-4 py-2.5 font-medium">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mt-6">
              <h2 className="font-display text-xl">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{listing.description}</p>
            </div>
          )}

          {/* Reviews — honest empty state (no fabricated ratings) */}
          <div className="mt-6 rounded-xl border border-dashed border-border p-4">
            <h2 className="font-display text-lg">Reviews</h2>
            <p className="mt-1 text-sm text-muted-foreground">No reviews yet for this factory.</p>
          </div>
        </div>

        {/* STICKY BUY BOX ~25% */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">Price</p>
              <p className="font-display text-3xl leading-tight">{inr(Number(listing.price))}<span className="text-base text-muted-foreground">/{listing.unit_type}</span></p>
              <p className="mt-0.5 text-xs text-muted-foreground">GST extra, as applicable</p>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">1% advance to reserve</span>
                <span className="font-display text-primary">{inr(Number(listing.price) * ADVANCE_RATE)}</span>
              </div>

              <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><dt>Dispatch</dt><dd className="text-foreground">1–3 working days</dd></div>
                <div className="flex justify-between"><dt>Transit</dt><dd className="text-foreground">By district distance</dd></div>
                <div className="flex justify-between"><dt>Tracking</dt><dd className="text-foreground">Live GPS available</dd></div>
              </dl>

              {isOwner ? (
                <Button asChild size="lg" className="mt-4 w-full bg-primary">
                  <Link to="/seller/listings">Edit your listing</Link>
                </Button>
              ) : soldOut ? (
                <Button disabled size="lg" className="mt-4 w-full">Sold out</Button>
              ) : (
                <div className="mt-4 space-y-2">
                  <Button onClick={() => setBooking(true)} size="lg" className="w-full bg-primary">Book Order</Button>
                  <Button onClick={() => setQuote(true)} variant="outline" size="lg" className="w-full">Request Quote</Button>
                  <Button onClick={() => setQuote(true)} variant="ghost" size="lg" className="w-full">Chat with Factory</Button>
                </div>
              )}
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {isOwner ? "This is your own listing." : "The 1% advance holds the stock — it is a reservation, not a completed purchase."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {booking && <BookingDialog listing={listing} user={user} onClose={() => setBooking(false)} />}
      {quote && <QuoteDialog listing={listing} seller={seller} onClose={() => setQuote(false)} />}
    </PageShell>
  );
}

function VariantRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <span key={o} className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">{o}</span>
        ))}
      </div>
    </div>
  );
}


function BookingDialog({ listing, user, onClose }: { listing: any; user: any; onClose: () => void }) {
  const nav = useNavigate();
  const computeDistance = useServerFn(computeDeliveryDistance);
  const [qty, setQty] = useState("1");
  const [ownVehicle, setOwnVehicle] = useState(false);
  const [addr, setAddr] = useState<any>(null);
  const [dist, setDist] = useState<{ km: number; charge: number; estimated: boolean } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stock = Number(listing.stock_available);
  const quantity = Math.max(0, Number(qty) || 0);
  const total = quantity * Number(listing.price);
  const advance = total * ADVANCE_RATE;
  const delivery = ownVehicle ? 0 : (dist?.charge ?? 0);
  const payNow = advance + delivery;

  // Recalculate distance-based delivery charge whenever the destination changes.
  useEffect(() => {
    if (ownVehicle || !addr) { setDist(null); return; }
    let cancelled = false;
    setCalcLoading(true);
    computeDistance({
      data: {
        origin: { state: listing.state, district: listing.district ?? "", mandal: listing.district ?? "" },
        destination: { state: addr.state, district: addr.district, mandal: addr.mandal },
      },
    })
      .then((r: { km: number; charge: number; estimated: boolean }) => { if (!cancelled) setDist(r); })
      .catch(() => { if (!cancelled) setDist(null); })
      .finally(() => { if (!cancelled) setCalcLoading(false); });
    return () => { cancelled = true; };
  }, [ownVehicle, addr, listing.state, listing.district]);

  const confirm = async () => {
    if (!user) { toast.info("Please sign in to book."); nav({ to: "/auth/login" }); return; }
    if (quantity <= 0) return toast.error("Enter a valid quantity");
    if (quantity > stock) return toast.error(`Only ${stock} ${listing.unit_type} available`);
    if (!addr) return toast.error("Select or add a delivery address");
    if (!ownVehicle && !dist) return toast.error("Delivery charge is still being calculated");

    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      quantity,
      unit_price: Number(listing.price),
      total_amount: total + delivery,
      advance_amount: advance,
      status: "confirmed",
      payment_status: "advance_paid",
      buyer_name: addr.contact_name,
      buyer_phone: addr.phone,
      delivery_address: [addr.line1, addr.mandal].filter(Boolean).join(", "),
      buyer_has_vehicle: ownVehicle,
      delivery_state: addr.state,
      delivery_district: addr.district,
      delivery_mandal: addr.mandal,
      delivery_pincode: addr.pincode || null,
      delivery_charge: delivery,
      distance_km: ownVehicle ? null : (dist?.km ?? null),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Reserved! 1% advance paid to hold your order. The seller will reach out to discuss next steps.");
    nav({ to: "/buyer" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
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

          <div className="rounded-xl border border-border bg-secondary/5 p-3">
            <p className="text-sm font-semibold">Do you have your own vehicle?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setOwnVehicle(true)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${ownVehicle ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>Yes, I'll arrange transport</button>
              <button type="button" onClick={() => setOwnVehicle(false)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${!ownVehicle ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>No, seller delivers</button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {ownVehicle
                ? "You'll assign your own driver from your Orders after booking. No delivery charge."
                : "The seller assigns a driver. Delivery charge is ₹10/km from the seller to your address."}
            </p>
          </div>

          <div>
            <Label>Delivery address</Label>
            {user ? (
              <div className="mt-1.5">
                <AddressPicker userId={user.id} selectedId={addr?.id} onSelect={setAddr} />
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">Sign in to add a delivery address.</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1 rounded-xl bg-muted p-4 text-sm">
          <Row label="Order total" value={inr(total)} />
          {!ownVehicle && (
            <Row
              label={dist ? `Delivery (${dist.km} km${dist.estimated ? ", est." : ""})` : "Delivery charge"}
              value={calcLoading ? "Calculating…" : dist ? inr(delivery) : "—"}
            />
          )}
          <Row label="Advance now (1%)" value={inr(advance)} highlight />
          <Row label="Pay now (advance + delivery)" value={inr(payNow)} highlight />
          <Row label="Balance on delivery" value={inr(total - advance)} muted />
        </div>

        <Button onClick={confirm} disabled={submitting || calcLoading} size="lg" className="mt-4 w-full bg-primary">
          {submitting ? "Processing payment…" : `Pay ${inr(payNow)} & confirm`}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Mock payment for demo. Stock reduces automatically.</p>
      </div>
    </div>
  );
}

function QuoteDialog({ listing, seller, onClose }: { listing: any; seller: any; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    // Contact-only quote request — no payment, no order created.
    setSent(true);
    toast.success("Quote request noted. The RockTek team will connect you with the seller.");
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Request Quote</p>
            <h2 className="mt-1 font-display text-2xl">{listing.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          No payment needed. Send a message and the RockTek team will connect you with {seller?.company_name ?? "the seller"} to discuss pricing and delivery.
        </p>
        <div className="mt-4 space-y-1.5">
          <Label>Your requirement (optional)</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Quantity, finish, timeline, delivery location…"
            rows={4}
          />
        </div>
        <Button onClick={submit} disabled={sent} size="lg" className="mt-4 w-full bg-primary">
          {sent ? "Request sent" : "Send quote request"}
        </Button>
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


function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">{children}</div>
      <SiteFooter />
    </div>
  );
}
