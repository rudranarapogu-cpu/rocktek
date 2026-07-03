import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDIA_STATES, INDIA_STATES_DISTRICTS } from "@/lib/india-locations";
import { type AddressValue, lookupPincode } from "@/lib/address";
import { sanitizePhone, isValidPhone, sanitizePincode, isValidPincode } from "@/lib/validation";
import { toast } from "sonner";

/**
 * Controlled address fields with real cascading State -> District dropdowns
 * (bundled India dataset) and Mandal/area options synced from the PIN code
 * (India Post). Phone is restricted to 10 digits.
 */
export function AddressFields({
  value,
  onChange,
}: {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
}) {
  const [areas, setAreas] = useState<string[]>([]);
  const [pinLoading, setPinLoading] = useState(false);
  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });

  const districts = value.state ? (INDIA_STATES_DISTRICTS[value.state] ?? []) : [];
  const phoneBad = value.phone.length > 0 && !isValidPhone(value.phone);
  const pinBad = value.pincode.length > 0 && !isValidPincode(value.pincode);

  const onPincode = async (pin: string) => {
    set({ pincode: pin });
    if (!isValidPincode(pin)) { setAreas([]); return; }
    setPinLoading(true);
    const res = await lookupPincode(pin);
    setPinLoading(false);
    if (!res) { toast.error("Could not verify that PIN code"); return; }
    const stateMatch = INDIA_STATES.find((s) => s.toLowerCase() === res.state.toLowerCase()) ?? res.state;
    const districtMatch = (INDIA_STATES_DISTRICTS[stateMatch] ?? []).find(
      (d) => d.toLowerCase() === res.district.toLowerCase(),
    ) ?? res.district;
    setAreas(res.areas);
    set({ pincode: pin, state: stateMatch, district: districtMatch, mandal: res.areas[0] ?? value.mandal });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Address label">
          <Input value={value.label} onChange={(e) => set({ label: e.target.value })} placeholder="Home / Site / Office" />
        </Field>
        <Field label="Contact name">
          <Input value={value.contact_name} onChange={(e) => set({ contact_name: e.target.value })} />
        </Field>
      </div>

      <Field label="Mobile number (10 digits)" error={phoneBad ? "Enter a valid 10-digit mobile number" : undefined}>
        <Input
          inputMode="numeric"
          value={value.phone}
          onChange={(e) => set({ phone: sanitizePhone(e.target.value) })}
          placeholder="9XXXXXXXXX"
        />
      </Field>

      <Field label="PIN code (6 digits)" error={pinBad ? "Enter a valid 6-digit PIN code" : undefined}>
        <div className="relative">
          <Input
            inputMode="numeric"
            value={value.pincode}
            onChange={(e) => onPincode(sanitizePincode(e.target.value))}
            placeholder="500001"
          />
          {pinLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="State">
          <Select value={value.state} onValueChange={(v) => set({ state: v, district: "", mandal: "" })}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {INDIA_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="District">
          <Select value={value.district} onValueChange={(v) => set({ district: v })} disabled={!value.state}>
            <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
            <SelectContent>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Mandal / Area">
          {areas.length > 0 ? (
            <Select value={value.mandal} onValueChange={(v) => set({ mandal: v })}>
              <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={value.mandal} onChange={(e) => set({ mandal: e.target.value })} placeholder="Enter PIN to load areas" />
          )}
        </Field>
      </div>

      <Field label="Full address (house / street / landmark)">
        <Textarea rows={2} value={value.line1} onChange={(e) => set({ line1: e.target.value })} />
      </Field>
    </div>
  );
}

export function addressIsValid(v: AddressValue): string | null {
  if (!v.contact_name.trim()) return "Enter a contact name";
  if (!isValidPhone(v.phone)) return "Enter a valid 10-digit mobile number";
  if (v.pincode && !isValidPincode(v.pincode)) return "Enter a valid 6-digit PIN code";
  if (!v.state) return "Select a state";
  if (!v.district) return "Select a district";
  if (!v.mandal.trim()) return "Select or enter a mandal / area";
  if (!v.line1.trim()) return "Enter the full address";
  return null;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
