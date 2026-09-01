"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shake/page-header";
import { FetchingBanner } from "@/components/shake/fetching-banner";
import { DataLegend } from "@/components/shake/data-legend";
import { CompaniesTable } from "@/components/shake/companies-table";
import { LoadingState } from "@/components/shake/loading-state";
import { routes } from "@/lib/routes";
import type { Dataset } from "@/lib/types";

export function ShakeDashboard({ initial }: { initial: Dataset }) {
  const willAutoRun = initial.shouldAutoRefresh;
  const [dataset, setDataset] = useState<Dataset>(initial);
  const [isRefreshing, setIsRefreshing] = useState(willAutoRun);
  const [loadingLabel, setLoadingLabel] = useState(willAutoRun ? "Discovering companies with AI…" : "Fetching data…");
  const autoRan = useRef(false);
  const showFullPageLoader = isRefreshing && dataset.companies.length === 0;

  const handleRefetch = useCallback(async (auto = false) => {
    setLoadingLabel(auto ? "Discovering companies with AI…" : "Fetching data…");
    setIsRefreshing(true);
    try {
      const res = await fetch(`${routes.api.companies}?refresh=true`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const next = (await res.json()) as Dataset;
      setDataset(next);
      toast.success(`Live pull complete — ${next.companies.length} companies.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Refetch failed: ${message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh on first load when cache is missing or older than 24 hours.
  useEffect(() => {
    if (autoRan.current || !initial.shouldAutoRefresh) return;
    autoRan.current = true;
    void handleRefetch(true);
  }, [initial.shouldAutoRefresh, handleRefetch]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader companies={dataset.companies} onRefetch={() => handleRefetch(false)} isLoading={isRefreshing} />
      {isRefreshing && !showFullPageLoader && <FetchingBanner label={loadingLabel} />}
      <DataLegend
        mode={dataset.mode}
        generatedAt={dataset.generatedAt}
        count={dataset.companies.length}
        notes={dataset.notes}
      />
      {showFullPageLoader ? (
        <LoadingState title={loadingLabel} />
      ) : (
        <CompaniesTable companies={dataset.companies} />
      )}
      <p className="text-center text-xs text-muted-foreground">
        Prototype for the Sustainium case study. No production credentials used; no prospects contacted.
      </p>
    </div>
  );
}
