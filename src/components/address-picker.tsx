import { useEffect, useState } from "react";
import { Plus, MapPin, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { AddressFields, addressIsValid } from "@/components/address-fields";
import { EMPTY_ADDRESS, formatAddress, type AddressValue } from "@/lib/address";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SavedAddress = AddressValue & { id: string; is_default?: boolean };

/**
 * Lists a user's saved delivery addresses, lets them pick one and add new ones.
 * When `onSelect` is provided the picker is selectable (used at checkout);
 * otherwise it acts as a manager (profile page).
 */
export function AddressPicker({
  userId,
  selectedId,
  onSelect,
}: {
  userId: string;
  selectedId?: string;
  onSelect?: (a: SavedAddress) => void;
}) {
  const [list, setList] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AddressValue>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as SavedAddress[];
        setList(rows);
        setLoading(false);
        if (onSelect && !selectedId && rows.length) onSelect(rows[0]);
      });
  };

  useEffect(load, [userId]);

  const save = async () => {
    const err = addressIsValid(draft);
    if (err) return toast.error(err);
    setSaving(true);
    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id: userId,
        label: draft.label || "Address",
        contact_name: draft.contact_name,
        phone: draft.phone,
        line1: draft.line1,
        state: draft.state,
        district: draft.district,
        mandal: draft.mandal,
        pincode: draft.pincode || null,
        is_default: list.length === 0,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Address saved");
    setOpen(false);
    setDraft(EMPTY_ADDRESS);
    load();
    if (onSelect && data) onSelect(data as SavedAddress);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList((l) => l.filter((a) => a.id !== id));
  };

  if (loading) return <div className="h-20 animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="space-y-2">
      {list.map((a) => {
        const active = selectedId === a.id;
        return (
          <div
            key={a.id}
            onClick={() => onSelect?.(a)}
            className={cn(
              "flex items-start justify-between gap-2 rounded-xl border p-3 text-sm",
              onSelect && "cursor-pointer",
              active ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">
                  {a.label}
                  {a.is_default && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">Default</span>}
                </p>
                <p className="text-muted-foreground">{a.contact_name} · {a.phone}</p>
                <p className="text-muted-foreground">{formatAddress(a)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {active && <Check className="h-4 w-4 text-primary" />}
              <button onClick={(e) => { e.stopPropagation(); remove(a.id); }} className="rounded p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-full">
        <Plus className="mr-1 h-4 w-4" /> Add {list.length ? "another" : "an"} address
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New delivery address</DialogTitle></DialogHeader>
          <AddressFields value={draft} onChange={setDraft} />
          <Button onClick={save} disabled={saving} className="mt-2 w-full bg-primary">
            {saving ? "Saving…" : "Save address"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
