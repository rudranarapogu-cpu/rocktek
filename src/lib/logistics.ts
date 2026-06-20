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

export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
