import { looksLikePersonName } from "@/lib/contact-quality";
import { readCache, writeCache, isCacheExpired } from "@/lib/cache";
import { normalizeContact } from "@/lib/contact-merge";
import { buildLiveRecords, liveSourcesConfigured } from "@/lib/pipeline";
import { getPreparedRecords, TARGET_COMPANY_COUNT } from "@/lib/prepared";
import { scoreAndRank } from "@/lib/scoring";
import { repairRecordSources } from "@/lib/source-repair";
import type { CompanyRecord, Dataset } from "@/lib/types";

function withReviewedNames(records: CompanyRecord[]): CompanyRecord[] {
  const prepared = getPreparedRecords();
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return records.map((record) => {
    if (looksLikePersonName(record.decisionMaker.name)) return record;
    const match = prepared.find((p) => p.id === record.id || norm(p.name) === norm(record.name));
    if (!match || !looksLikePersonName(match.decisionMaker.name)) return record;
    return { ...record, decisionMaker: { ...match.decisionMaker, buyingRole: record.decisionMaker.buyingRole || match.decisionMaker.buyingRole } };
  });
}

/**
 * Server-side dataset assembly shared by the page and the API route.
 * Scoring is always applied on read so the same records yield the same ranks.
 */

function toDataset(
  records: CompanyRecord[],
  mode: Dataset["mode"],
  generatedAt: string,
  notes: string,
  shouldAutoRefresh: boolean,
): Dataset {
  const configured = liveSourcesConfigured();
  return {
    generatedAt,
    mode,
    notes,
    companies: scoreAndRank(
      withReviewedNames(records).map((r) => {
        const repaired = repairRecordSources(r);
        return { ...repaired, contact: normalizeContact(repaired.contact) };
      }),
    ).slice(0, TARGET_COMPANY_COUNT),
    shouldAutoRefresh,
    aiConfigured: configured.ai,
  };
}

export async function getCachedDataset(): Promise<Dataset> {
  const cache = await readCache();
  const configured = liveSourcesConfigured();
  const prepared = getPreparedRecords();
  const hasValidCache = Boolean(cache?.records && cache.records.length >= TARGET_COMPANY_COUNT);
  const records = hasValidCache ? cache!.records : prepared;
  const shouldAutoRefresh =
    configured.ai && (!hasValidCache || isCacheExpired(cache!.generatedAt));

  return toDataset(
    records,
    "cached",
    cache?.generatedAt ?? new Date().toISOString(),
    hasValidCache
      ? "Cached live pull. Use Refetch to refresh now, or wait for the 24-hour auto-refresh."
      : "Manually reviewed from public sources. Emails are inferred and unverified — use Refetch for a live pull.",
    shouldAutoRefresh,
  );
}

export async function refreshDataset(): Promise<Dataset> {
  const configured = liveSourcesConfigured();
  const records = await buildLiveRecords();
  const cache = await writeCache(records);
  const configuredList = Object.entries(configured)
    .filter(([, on]) => on)
    .map(([name]) => name)
    .join(", ");
  return toDataset(
    records,
    "live",
    cache.generatedAt,
    configuredList
      ? `Active sources: ${configuredList}. Missing fields fall back to reviewed data and stay labelled.`
      : "No live sources configured — showing reviewed base data.",
    false,
  );
}
