import { Check } from "lucide-react";
import { TRIP_STATUSES, TRIP_STATUS_LABEL, type TripStatus } from "@/lib/logistics";

export function TripTimeline({ status }: { status: TripStatus }) {
  const currentIdx = TRIP_STATUSES.indexOf(status);
  return (
    <ol className="space-y-3">
      {TRIP_STATUSES.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex items-center gap-3">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : active
                    ? "border-primary bg-primary/15 text-primary animate-pulse"
                    : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={`text-sm ${active ? "font-semibold text-foreground" : done ? "text-foreground/70" : "text-muted-foreground"}`}>
              {TRIP_STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
