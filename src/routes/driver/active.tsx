import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navigation, Play, Square, ArrowRight, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useGpsShare } from "@/hooks/use-gps-share";
import { TripMap } from "@/components/trip-map";
import { TripTimeline } from "@/components/trip-timeline";
import { TRIP_STATUS_LABEL, nextTripStatus, type TripStatus } from "@/lib/logistics";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/active")({
  component: ActiveTrips,
});

function ActiveTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: d } = await supabase.from("drivers").select("id").eq("user_id", user.id).maybeSingle();
    if (!d) { setLoading(false); return; }
    const { data } = await supabase
      .from("trips")
      .select("*,orders(buyer_name,delivery_address,listings(title))")
      .eq("driver_id", d.id)
      .eq("acceptance", "accepted")
      .neq("status", "delivered")
      .order("created_at", { ascending: false });
    setTrips(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Driver</p>
      <h1 className="mt-1 font-display text-3xl">Active Trips & GPS</h1>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Navigation className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No active trips. Delivered trips move to history.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">{trips.map((t) => <ActiveTripCard key={t.id} trip={t} userId={user!.id} onChange={load} />)}</div>
      )}
    </div>
  );
}

function ActiveTripCard({ trip, userId, onChange }: { trip: any; userId: string; onChange: () => void }) {
  const gps = useGpsShare(trip.id);
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [showProof, setShowProof] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const next = nextTripStatus(status);

  const advance = async () => {
    if (!next) return;
    // Completing delivery requires a delivery photo first.
    if (next === "delivered") { setShowProof(true); return; }
    const patch: any = { status: next };
    if (status === "assigned") patch.started_at = new Date().toISOString();
    const { error } = await supabase.from("trips").update(patch).eq("id", trip.id);
    if (error) return toast.error(error.message);
    setStatus(next);
    toast.success(`Status: ${TRIP_STATUS_LABEL[next]}`);
  };

  const completeDelivery = async () => {
    if (!photo) return toast.error("A delivery photo is required to complete delivery");
    setSaving(true);
    try {
      const path = `${userId}/proofs/${trip.id}/${Date.now()}-${photo.name}`;
      const { error: upErr } = await supabase.storage.from("listing-media").upload(path, photo);
      if (upErr) throw upErr;
      const image_url = supabase.storage.from("listing-media").getPublicUrl(path).data.publicUrl;
      const { error: pErr } = await supabase.from("delivery_proofs").insert({ trip_id: trip.id, image_url, notes: notes || null });
      if (pErr) throw pErr;
      const { error } = await supabase.from("trips").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", trip.id);
      if (error) throw error;
      await supabase.from("orders").update({ status: "delivered", payment_status: "paid" }).eq("id", trip.order_id);
      gps.stop();
      toast.success("Delivery completed with proof uploaded.");
      setShowProof(false);
      onChange();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to complete delivery");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-xl">{trip.orders?.listings?.title ?? "Shipment"}</p>
          <p className="text-sm text-muted-foreground">{trip.orders?.buyer_name} · {trip.orders?.delivery_address}</p>
        </div>
        <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{TRIP_STATUS_LABEL[status]}</span>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <TripMap lat={gps.lat} lng={gps.lng} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {gps.sharing ? (
              <Button variant="outline" onClick={gps.stop}><Square className="mr-2 h-4 w-4" /> Stop sharing</Button>
            ) : (
              <Button className="bg-primary" onClick={gps.start}><Play className="mr-2 h-4 w-4" /> Share live GPS</Button>
            )}
            {gps.sharing && <span className="text-xs text-accent-foreground">● Broadcasting location</span>}
          </div>
          {gps.error && <p className="mt-2 text-xs text-destructive">{gps.error}</p>}
        </div>

        <div>
          <TripTimeline status={status} />
          {next && !showProof && (
            <Button onClick={advance} className="mt-4 w-full bg-primary">
              {next === "delivered" ? <>Complete delivery <Camera className="ml-2 h-4 w-4" /></> : <>Advance to {TRIP_STATUS_LABEL[next]} <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          )}

          {showProof && (
            <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-semibold">Proof of delivery (required)</p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-5 text-center text-sm text-muted-foreground hover:border-primary">
                <Upload className="h-5 w-5 text-primary" />
                <span className="line-clamp-1">{photo ? photo.name : "Upload delivery photo"}</span>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(f); }} />
              </label>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={completeDelivery} disabled={saving} className="flex-1 bg-primary">{saving ? "Saving…" : "Confirm delivery"}</Button>
                <Button variant="outline" onClick={() => setShowProof(false)} disabled={saving}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
