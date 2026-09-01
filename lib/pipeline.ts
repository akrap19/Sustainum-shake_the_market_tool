import { seedBrands, excludedCustomers } from "@/lib/seed";
import { readCache } from "@/lib/cache";
import { TARGET_COMPANY_COUNT, getPreparedRecords } from "@/lib/prepared";
import { MIN_UK_LOCATIONS, scoreAndRank } from "@/lib/scoring";
import * as ch from "@/lib/sources/companies-house";
import * as hunter from "@/lib/sources/hunter";
import * as ai from "@/lib/sources/ai-discovery";
import * as verifier from "@/lib/sources/email-verifier";
import { preferDecisionMaker, findPrevious } from "@/lib/contact-merge";
import { enrichTarget } from "@/lib/pipeline-enrich";
import { candidateToRecord, type EnrichTarget, targetFromCandidate, targetFromSeed } from "@/lib/pipeline-targets";
import type { CompanyRecord } from "@/lib/types";

/** Live enrichment. Gemini proposes companies; live sources ground the fields. */
const ENRICH_CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function resolveTargets(): Promise<Array<{ target: EnrichTarget; base: CompanyRecord }>> {
  const excluded = new Set(excludedCustomers.map((c) => c.name.toLowerCase()));
  const candidates = await ai.discoverCompanies();
  if (candidates && candidates.length) {
    return candidates
      .filter((c) => !excluded.has(c.name.toLowerCase()))
      .map((c) => ({ target: targetFromCandidate(c), base: candidateToRecord(c) }));
  }

  const cache = await readCache();
  const prepared = getPreparedRecords();
  const baseById = new Map(prepared.map((r) => [r.id, r]));
  for (const record of cache?.records ?? []) {
    const existing = baseById.get(record.id);
    baseById.set(record.id, {
      ...record,
      decisionMaker: preferDecisionMaker(existing?.decisionMaker, record.decisionMaker),
    });
  }
  return seedBrands
    .filter((brand) => !excluded.has(brand.name.toLowerCase()) && baseById.has(brand.id))
    .map((brand) => ({ target: targetFromSeed(brand), base: baseById.get(brand.id)! }));
}

function toCompanyRecord(scored: ReturnType<typeof scoreAndRank>[number]): CompanyRecord {
  const { score, confidence, needsReview, needsReviewReasons, ...record } = scored;
  void score;
  void confidence;
  void needsReview;
  void needsReviewReasons;
  return record;
}

function selectTopRecords(records: CompanyRecord[]): CompanyRecord[] {
  const eligible = records.filter((c) => !c.isCurrentCustomer);
  const qualifying = eligible.filter((c) => c.locations.count >= MIN_UK_LOCATIONS);
  const qualifyingIds = new Set(qualifying.map((c) => c.id));
  const pool =
    qualifying.length >= TARGET_COMPANY_COUNT
      ? qualifying
      : [
          ...qualifying,
          ...eligible
            .filter((c) => !qualifyingIds.has(c.id))
            .sort((a, b) => b.locations.count - a.locations.count),
        ];

  return scoreAndRank(pool).slice(0, TARGET_COMPANY_COUNT).map(toCompanyRecord);
}

export async function buildLiveRecords(): Promise<CompanyRecord[]> {
  const [targets, cache] = await Promise.all([resolveTargets(), readCache()]);
  const prior = cache?.records ?? [];
  const enriched = await mapWithConcurrency(targets, ENRICH_CONCURRENCY, ({ target, base }) =>
    enrichTarget(target, base, findPrevious(prior, target)),
  );
  return selectTopRecords(enriched);
}

export function liveSourcesConfigured() {
  return {
    ai: ai.isConfigured(),
    companiesHouse: ch.isConfigured(),
    vrfymail: verifier.isPrimaryConfigured(),
    emailVerifier: verifier.isConfigured(),
    hunter: hunter.isConfigured(),
    overpass: true,
  };
}
