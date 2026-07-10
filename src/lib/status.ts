// Centralized status → color mapping per RockTek UI/UX spec §15 (simplified set).
// Accent orange is reserved for buttons/CTAs — status chips never use it.

export type StatusTone =
  | "neutral" // early / informational, no action yet
  | "warning" // pending / in-review / payment pending
  | "info" // confirmed / accepted milestones
  | "progress" // readiness milestones (loading, ready, dispatched)
  | "transit" // in-motion states
  | "success" // completed / delivered / available
  | "error"; // rejected / cancelled / expired / disputed

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-status-neutral text-status-neutral-foreground",
  warning: "bg-status-warning text-status-warning-foreground",
  info: "bg-status-info text-status-info-foreground",
  progress: "bg-status-progress text-status-progress-foreground",
  transit: "bg-status-transit text-status-transit-foreground",
  success: "bg-status-success text-status-success-foreground",
  error: "bg-status-error text-status-error-foreground",
};

export function toneClass(tone: StatusTone): string {
  return TONE_CLASS[tone];
}

/** Map any raw status string (order / trip / listing / payment) to a tone. */
export function statusTone(status?: string | null): StatusTone {
  const s = (status ?? "").toLowerCase();
  switch (s) {
    // early / informational
    case "pending":
    case "new":
    case "created":
    case "booking_created":
      return "neutral";
    // waiting / review
    case "reviewing":
    case "in_review":
    case "negotiation":
    case "negotiating":
    case "payment_pending":
    case "material_preparation":
    case "preparing":
    case "waiting":
    case "busy":
      return "warning";
    // confirmed / accepted
    case "confirmed":
    case "accepted":
    case "assigned":
    case "driver_assigned":
    case "payment_confirmed":
    case "advance_paid":
      return "info";
    // readiness milestones
    case "loading":
    case "material_ready":
    case "ready":
    case "loaded":
    case "dispatched":
    case "picked_up":
    case "truck_dispatched":
      return "progress";
    // in-motion
    case "in_transit":
    case "near_destination":
    case "journey_started":
    case "live":
      return "transit";
    // success / terminal-good
    case "delivered":
    case "completed":
    case "active":
    case "available":
    case "verified":
    case "approved":
      return "success";
    // error / terminal-bad
    case "rejected":
    case "cancelled":
    case "canceled":
    case "expired":
    case "disputed":
    case "offline":
      return "error";
    default:
      return "neutral";
  }
}
