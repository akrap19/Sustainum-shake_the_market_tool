import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Split } from "@/components/layout/split";
import { Stack } from "@/components/layout/stack";
import { LegendKeys } from "@/components/shake/legend-keys";
import { cn } from "@/lib/utils";
import type { DatasetMode } from "@/lib/types";

export function DataLegend({
  mode,
  generatedAt,
  count,
  notes,
}: {
  mode: DatasetMode;
  generatedAt: string;
  count: number;
  notes?: string;
}) {
  const when = new Date(generatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const isLive = mode === "live";

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-sm">
      <Split className="items-start gap-6 px-5 py-4 lg:flex-nowrap">
        <Stack className="min-w-0 flex-1 gap-2">
          <h2 className="text-base font-semibold text-foreground">
            {count} UK prospects for paper-lid outreach
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Multi-site QSR, coffee and food-to-go chains with 20+ UK locations</li>
            <li>Ranked for Sustainium&apos;s PFAS-free moulded-fibre paper lids — current customers excluded</li>
            <li>One decision-maker per row, with source tags and a priority score (see legend below)</li>
          </ul>
          {notes && <p className="text-xs leading-relaxed text-muted-foreground">{notes}</p>}
        </Stack>
        <Stack className="shrink-0 items-end gap-1.5 pt-0.5">
          <Badge
            variant="outline"
            className={cn(
              isLive
                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                : "border-sky-500/40 text-sky-700 dark:text-sky-400",
            )}
          >
            {isLive ? "Live pull" : "Prepared / cached"}
          </Badge>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3 shrink-0" aria-hidden />
            <span>Generated {when}</span>
          </p>
        </Stack>
      </Split>
      <LegendKeys />
    </section>
  );
}
