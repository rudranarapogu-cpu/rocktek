// Shared logistics constants & helpers for RockTek Services

export const TRIP_STATUSES = [
  "assigned",
  "loading",
  "picked_up",
  "in_transit",
  "near_destination",
  "delivered",
] as const;

export type TripStatus = (typeof TRIP_STATUSES)[number];

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  assigned: "Assigned",
  loading: "Loading",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  near_destination: "Near Destination",
  delivered: "Delivered",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function nextTripStatus(current: TripStatus): TripStatus | null {
  const i = TRIP_STATUSES.indexOf(current);
  if (i < 0 || i >= TRIP_STATUSES.length - 1) return null;
  return TRIP_STATUSES[i + 1];
}

export function tripProgress(status: TripStatus): number {
  const i = TRIP_STATUSES.indexOf(status);
  return Math.round(((i + 1) / TRIP_STATUSES.length) * 100);
}

export const ADVANCE_RATE = 0.01; // 1% advance

// Delivery charge estimate (₹) when the buyer does NOT have their own vehicle.
// Heuristic based on origin (seller/listing) vs destination (buyer) location
// plus the order quantity (heavier loads cost more to move).
export function deliveryCharge(opts: {
  originState?: string | null;
  originDistrict?: string | null;
  destState?: string | null;
  destDistrict?: string | null;
  quantity: number;
}): number {
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  const sameState = norm(opts.originState) && norm(opts.originState) === norm(opts.destState);
  const sameDistrict = sameState && norm(opts.originDistrict) && norm(opts.originDistrict) === norm(opts.destDistrict);

  let base: number;
  if (sameDistrict) base = 1500;        // within the same district
  else if (sameState) base = 3500;      // same state, different district
  else base = 7000;                     // inter-state haul

  const perUnit = 60 * Math.max(1, Math.ceil(opts.quantity || 1));
  return base + perUnit;
}

export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
