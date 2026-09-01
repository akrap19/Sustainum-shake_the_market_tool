import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConfidenceLevel, Provenance, ValidationStatus } from "@/lib/types";

const PROVENANCE: Record<Provenance, { label: string; className: string }> = {
  live: { label: "Live", className: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400" },
  cached: { label: "Cached", className: "border-sky-500/40 text-sky-700 dark:text-sky-400" },
  "manually-reviewed": { label: "Reviewed", className: "border-violet-500/40 text-violet-700 dark:text-violet-400" },
  inferred: { label: "Inferred", className: "border-amber-500/40 text-amber-700 dark:text-amber-400" },
  mocked: { label: "Mocked", className: "border-zinc-500/40 text-zinc-600 dark:text-zinc-400" },
};

const VALIDATION: Record<ValidationStatus, { label: string; className: string }> = {
  verified: { label: "Verified", className: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400" },
  unverified: { label: "Unverified", className: "border-amber-500/40 text-amber-700 dark:text-amber-400" },
  unknown: { label: "Unknown", className: "border-zinc-500/40 text-zinc-600 dark:text-zinc-400" },
  invalid: { label: "Invalid", className: "border-red-500/40 text-red-700 dark:text-red-400" },
};

const CONFIDENCE: Record<ConfidenceLevel, { label: string; shortLabel: string; className: string }> = {
  high: { label: "High confidence", shortLabel: "High", className: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400" },
  medium: { label: "Medium confidence", shortLabel: "Medium", className: "border-amber-500/40 text-amber-700 dark:text-amber-400" },
  low: { label: "Low confidence", shortLabel: "Low", className: "border-zinc-500/40 text-zinc-600 dark:text-zinc-400" },
};

export function ProvenanceBadge({ provenance, className }: { provenance: Provenance; className?: string }) {
  const { label, className: tone } = PROVENANCE[provenance];
  return <Badge variant="outline" className={cn(tone, className)}>{label}</Badge>;
}

export function ValidationBadge({ status, className }: { status: ValidationStatus; className?: string }) {
  const { label, className: tone } = VALIDATION[status];
  return <Badge variant="outline" className={cn(tone, className)}>{label}</Badge>;
}

export function ConfidenceBadge({
  level,
  compact = false,
  className,
}: {
  level: ConfidenceLevel;
  compact?: boolean;
  className?: string;
}) {
  const { label, shortLabel, className: tone } = CONFIDENCE[level];
  return (
    <Badge variant="outline" className={cn(tone, className)}>
      {compact ? shortLabel : label}
    </Badge>
  );
}
