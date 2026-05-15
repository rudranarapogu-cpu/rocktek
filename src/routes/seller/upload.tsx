import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/seller/upload")({
  component: UploadInventory,
});

function UploadInventory() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [seller, setSeller] = useState<any>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", category_id: "", description: "", quantity: "", unit_type: "sqft",
    price: "", state: "", district: "", shading_quality: "", finish_type: "",
    dimensions: "", stock_available: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user) return;
    supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setSeller(data));
    supabase.from("categories").select("id,name").then(({ data }) => setCats(data ?? []));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !seller) return toast.error("Complete onboarding first");
    if (seller.status !== "approved") return toast.error("Account not yet verified");

    const schema = z.object({
      title: z.string().min(3).max(150),
      category_id: z.string().uuid(),
      quantity: z.coerce.number().positive(),
      unit_type: z.enum(["sqft", "tons"]),
      price: z.coerce.number().positive(),
      state: z.string().min(2).max(60),
      stock_available: z.coerce.number().positive(),
    });
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (files.length === 0) return toast.error("Add at least one image");

    setSubmitting(true);
    try {
      const payload: any = {
        ...form,
        seller_id: seller.id,
        quantity: Number(form.quantity),
        price: Number(form.price),
        stock_available: Number(form.stock_available),
      };
      const { data: listing, error } = await supabase.from("listings").insert(payload).select("id").single();
      if (error) throw error;

      // Upload images
      const imageRows: { listing_id: string; url: string; position: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `${user.id}/${listing.id}/${Date.now()}-${i}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("listing-media").upload(path, f);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("listing-media").getPublicUrl(path);
        imageRows.push({ listing_id: listing.id, url: pub.publicUrl, position: i });
      }
      if (imageRows.length) await supabase.from("listing_images").insert(imageRows);

      toast.success("Listing published");
      nav({ to: "/seller/listings" });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Upload inventory</h1>
      <p className="mt-1 text-sm text-muted-foreground">Listing is active for 7 days. You can refresh anytime.</p>

      {seller && seller.status !== "approved" && (
        <div className="mt-6 rounded-xl border border-accent bg-accent/10 p-4 text-sm">
          Your account is awaiting verification. You can prepare a draft below, but listings can only go live once approved.
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><F label="Title"><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Premium Galaxy Black Granite Slabs" /></F></div>
        <F label="Category">
          <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
            <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </F>
        <F label="Unit type">
          <Select value={form.unit_type} onValueChange={(v) => set("unit_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sqft">Sqft</SelectItem><SelectItem value="tons">Tons</SelectItem></SelectContent>
          </Select>
        </F>
        <F label="Quantity"><Input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></F>
        <F label="Stock available"><Input type="number" min="0" value={form.stock_available} onChange={(e) => set("stock_available", e.target.value)} /></F>
        <F label="Price (₹ per unit)"><Input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} /></F>
        <F label="Dimensions"><Input value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="e.g. 9x5 ft" /></F>
        <F label="Shading quality"><Input value={form.shading_quality} onChange={(e) => set("shading_quality", e.target.value)} placeholder="e.g. Premium / Commercial" /></F>
        <F label="Finish type"><Input value={form.finish_type} onChange={(e) => set("finish_type", e.target.value)} placeholder="e.g. Polished / Honed" /></F>
        <F label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></F>
        <F label="District / City"><Input value={form.district} onChange={(e) => set("district", e.target.value)} /></F>
        <div className="sm:col-span-2"><F label="Description"><Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></F></div>

        <div className="sm:col-span-2">
          <Label>Images</Label>
          <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground hover:border-primary">
            <Upload className="h-6 w-6 text-primary" />
            <span>{files.length ? `${files.length} image(s) selected` : "Click to choose images"}</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </label>
          {files.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {files.map((f, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-md border border-border bg-muted">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" size="lg" disabled={submitting} className="w-full bg-primary">{submitting ? "Publishing…" : "Publish listing"}</Button>
        </div>
      </form>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
