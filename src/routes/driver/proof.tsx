import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/proof")({
  component: DeliveryProof,
});

function DeliveryProof() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [proofs, setProofs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: d } = await supabase.from("drivers").select("id").eq("user_id", user.id).maybeSingle();
    if (!d) { setLoading(false); return; }
    const { data: t } = await supabase
      .from("trips")
      .select("id,status,order_id,orders(buyer_name,listings(title))")
      .eq("driver_id", d.id)
      .eq("status", "delivered")
      .order("updated_at", { ascending: false });
    setTrips(t ?? []);
    const ids = (t ?? []).map((x) => x.id);
    if (ids.length) {
      const { data: p } = await supabase.from("delivery_proofs").select("*").in("trip_id", ids);
      setProofs(Object.fromEntries((p ?? []).map((x) => [x.trip_id, x])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Driver</p>
      <h1 className="mt-1 font-display text-3xl">Delivery Proof</h1>
      <p className="mt-1 text-sm text-muted-foreground">Upload a delivery photo and document for each completed trip.</p>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" />
      ) : trips.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No delivered trips yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {trips.map((t) => <ProofCard key={t.id} trip={t} userId={user!.id} existing={proofs[t.id]} onDone={load} />)}
        </div>
      )}
    </div>
  );
}

function ProofCard({ trip, userId, existing, onDone }: { trip: any; userId: string; existing: any; onDone: () => void }) {
  const [image, setImage] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const upload = async (file: File, kind: string) => {
    const path = `proofs/${userId}/${trip.id}/${Date.now()}-${kind}-${file.name}`;
    const { error } = await supabase.storage.from("listing-media").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("listing-media").getPublicUrl(path).data.publicUrl;
  };

  const submit = async () => {
    if (!image && !doc && !notes) return toast.error("Add a photo, document, or note");
    setSaving(true);
    try {
      const image_url = image ? await upload(image, "img") : null;
      const doc_url = doc ? await upload(doc, "doc") : null;
      const { error } = await supabase.from("delivery_proofs").insert({ trip_id: trip.id, image_url, doc_url, notes: notes || null });
      if (error) throw error;
      toast.success("Proof of delivery saved");
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-display text-lg">{trip.orders?.listings?.title}</p>
      <p className="text-sm text-muted-foreground">Delivered to {trip.orders?.buyer_name}</p>

      {existing ? (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-accent/15 px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Proof uploaded
          {existing.image_url && <a href={existing.image_url} target="_blank" rel="noreferrer" className="text-primary underline">photo</a>}
          {existing.doc_url && <a href={existing.doc_url} target="_blank" rel="noreferrer" className="text-primary underline">document</a>}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FileBox label={image ? image.name : "Delivery photo"} accept="image/*" onPick={setImage} />
          <FileBox label={doc ? doc.name : "Delivery document"} accept="image/*,application/pdf" onPick={setDoc} />
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={submit} disabled={saving} className="w-full bg-primary">{saving ? "Uploading…" : "Submit proof"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FileBox({ label, accept, onPick }: { label: string; accept: string; onPick: (f: File) => void }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-5 text-center text-sm text-muted-foreground hover:border-primary">
      <Upload className="h-5 w-5 text-primary" />
      <span className="line-clamp-1">{label}</span>
      <input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
    </label>
  );
}
