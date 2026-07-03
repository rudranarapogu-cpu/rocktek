export interface AddressValue {
  id?: string;
  label: string;
  contact_name: string;
  phone: string;
  line1: string;
  state: string;
  district: string;
  mandal: string;
  pincode: string;
}

export const EMPTY_ADDRESS: AddressValue = {
  label: "Home",
  contact_name: "",
  phone: "",
  line1: "",
  state: "",
  district: "",
  mandal: "",
  pincode: "",
};

export function formatAddress(a: {
  line1?: string | null;
  mandal?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
}): string {
  return [a.line1, a.mandal, a.district, a.state, a.pincode].filter(Boolean).join(", ");
}

/** Look up state/district/area suggestions from an Indian PIN code (India Post, free). */
export async function lookupPincode(
  pin: string,
): Promise<{ state: string; district: string; areas: string[] } | null> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const json = (await res.json()) as Array<{
      Status: string;
      PostOffice: Array<{ Name: string; District: string; State: string; Block: string }> | null;
    }>;
    const first = json?.[0];
    if (!first || first.Status !== "Success" || !first.PostOffice?.length) return null;
    const po = first.PostOffice;
    const areas = Array.from(new Set(po.flatMap((p) => [p.Name, p.Block].filter(Boolean)))).sort();
    return { state: po[0].State, district: po[0].District, areas };
  } catch {
    return null;
  }
}
