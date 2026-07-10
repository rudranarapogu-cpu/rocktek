import { cn } from "@/lib/utils";
import { statusTone, toneClass, type StatusTone } from "@/lib/status";

interface StatusChipProps {
  /** Raw status string; tone is auto-derived unless `tone` is passed. */
  status?: string | null;
  /** Visible label. Falls back to a title-cased status. */
  label?: string;
  /** Override the auto-derived tone. */
  tone?: StatusTone;
  className?: string;
}

function titleCase(s: string) {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Status pill — always shows color + text (spec §15: never color alone).
 * Uses semantic status tokens; accent orange is never used here.
 */
export function StatusChip({ status, label, tone, className }: StatusChipProps) {
  const resolved = tone ?? statusTone(status);
  const text = label ?? (status ? titleCase(status) : "—");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        toneClass(resolved),
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {text}
    </span>
  );
}
