import { createServerFn } from "@tanstack/react-start";

const RATE_PER_KM = 10; // ₹10 per km
const MIN_CHARGE = 500; // minimum delivery charge

interface Place {
  state: string;
  district: string;
  mandal: string;
}

async function geocode(p: Place): Promise<{ lat: number; lng: number } | null> {
  const q = [p.mandal, p.district, p.state, "India"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "RockTek-Marketplace/1.0 (delivery-distance)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Compute road-ish delivery distance (km) between the seller's mandal and the
 * buyer's mandal using free OpenStreetMap geocoding, and derive the ₹10/km charge.
 * Falls back to a coarse estimate if geocoding fails.
 */
export const computeDeliveryDistance = createServerFn({ method: "POST" })
  .inputValidator((data: { origin: Place; destination: Place }) => data)
  .handler(async ({ data }) => {
    const [origin, dest] = await Promise.all([geocode(data.origin), geocode(data.destination)]);

    if (!origin || !dest) {
      // Fallback: coarse tiered estimate when a place can't be geocoded.
      const same = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
      const km = same(data.origin.district, data.destination.district)
        ? 40
        : same(data.origin.state, data.destination.state)
          ? 180
          : 600;
      return { km, charge: Math.max(MIN_CHARGE, Math.round(km * RATE_PER_KM)), estimated: true as const };
    }

    // Road distance is typically ~1.3x straight-line.
    const km = Math.round(haversineKm(origin, dest) * 1.3);
    return { km, charge: Math.max(MIN_CHARGE, km * RATE_PER_KM), estimated: false as const };
  });
