import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ShieldCheck, Upload } from "lucide-react";

export const Route = createFileRoute("/seller/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { user, loading, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [existing, setExisting] = useState<any>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: "", owner_name: "", gst_number: "", gst_address: "", state: "", phone: "", email: "",
  });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setExisting(data);
      if (data) setForm({
        company_name: data.company_name, owner_name: data.owner_name, gst_number: data.gst_number,
        gst_address: data.gst_address, state: data.state, phone: data.phone, email: data.email,
      });
      else setForm((f) => ({ ...f, email: user.email ?? "" }));
    });
  }, [user]);

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const schema = z.object({
      company_name: z.string().min(2).max(200),
      owner_name: z.string().min(2).max(120),
      gst_number: z.string().min(10).max(20),
      gst_address: z.string().min(10).max(500),
      state: z.string().min(2).max(60),
      phone: z.string().min(7).max(20),
      email: z.string().email(),
    });
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!existing && (!files || files.length < 2)) return toast.error("Upload at least 2 invoice/GST documents");

    setSubmitting(true);
    try {
      let sellerId = existing?.id;
      if (!sellerId) {
        const { data, error } = await supabase.from("sellers").insert({ ...form, user_id: user.id }).select("id").single();
        if (error) throw error;
        sellerId = data.id;
        // grant seller role
        await supabase.from("user_roles").upsert({ user_id: user.id, role: "seller" }, { onConflict: "user_id,role" });
      } else {
        await supabase.from("sellers").update(form).eq("id", sellerId);
      }

      if (files && files.length > 0) {
        for (const f of Array.from(files)) {
          const path = `${user.id}/${sellerId}/${Date.now()}-${f.name}`;
          const { error: upErr } = await supabase.storage.from("seller-documents").upload(path, f);
          if (upErr) throw upErr;
          await supabase.from("seller_documents").insert({ seller_id: sellerId, doc_type: f.type.includes("pdf") ? "pdf" : "image", url: path });
        }
      }

      await refreshRoles();
      toast.success("Submitted! Pending admin verification.");
      nav({ to: "/seller" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">Seller Verification</p>
        <h1 className="mt-1 font-display text-4xl">Business details</h1>
        <p className="mt-2 text-sm text-muted-foreground">Provide your business info and supporting documents. RockTek admins review within 24–48 hours.</p>

        {existing?.status === "approved" && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-accent bg-accent/10 p-4 text-sm">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <p>Your account is <strong>verified</strong>. <Link to="/seller" className="underline">Go to dashboard →</Link></p>
          </div>
        )}
        {existing?.status === "pending" && (
          <div className="mt-6 rounded-xl border border-border bg-muted p-4 text-sm">
            <strong>Pending verification.</strong> You can update details below.
          </div>
        )}

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Company name"><Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} /></Field>
          <Field label="Owner name"><Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></Field>
          <Field label="GST number"><Input value={form.gst_number} onChange={(e) => set("gst_number", e.target.value)} /></Field>
          <Field label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="GST registered address"><Textarea rows={2} value={form.gst_address} onChange={(e) => set("gst_address", e.target.value)} /></Field></div>
          <div className="sm:col-span-2">
            <Label>Upload 2–3 invoices + GST proof</Label>
            <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground hover:border-primary">
              <Upload className="h-6 w-6 text-primary" />
              <span>{files?.length ? `${files.length} file(s) selected` : "Click to choose images or PDFs"}</span>
              <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => setFiles(e.target.files)} />
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={submitting} className="w-full bg-primary">{submitting ? "Submitting…" : existing ? "Update details" : "Submit for verification"}</Button>
          </div>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
