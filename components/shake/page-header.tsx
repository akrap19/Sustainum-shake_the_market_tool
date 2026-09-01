import Image from "next/image";
import { ExportCsvButton } from "@/components/shake/export-csv-button";
import { RefetchButton } from "@/components/shake/refetch-button";
import type { ScoredCompany } from "@/lib/types";

export function PageHeader({
  companies,
  onRefetch,
  isLoading,
}: {
  companies: ScoredCompany[];
  onRefetch: () => void;
  isLoading: boolean;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Image
          src="/sustainium-logo.webp"
          alt="Sustainium"
          width={1420}
          height={158}
          priority
          className="h-6 w-auto dark:invert"
        />
        <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Shake the Market</span>
      </div>
      <div className="flex items-center gap-2">
        <RefetchButton onRefetch={onRefetch} isLoading={isLoading} />
        <ExportCsvButton companies={companies} />
      </div>
    </header>
  );
}
