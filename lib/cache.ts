import { promises as fs } from "node:fs";
import path from "node:path";
import { repairRecordSources } from "@/lib/source-repair";
import type { CompanyRecord } from "@/lib/types";

/**
 * File-backed cache of the last enriched pull. Keeping raw (unscored) records
 * means scoring is always recomputed deterministically on read, and lets the
 * demo run reproducibly without live API keys or hitting rate limits.
 */

const CACHE_PATH = path.join(process.cwd(), "data", "cache.json");

/** Live pulls are reused without auto-refresh for this long. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheFile {
  generatedAt: string;
  records: CompanyRecord[];
}

export async function readCache(): Promise<CacheFile | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as CacheFile;
    return { ...parsed, records: parsed.records.map(repairRecordSources) };
  } catch {
    return null;
  }
}

export async function writeCache(records: CompanyRecord[]): Promise<CacheFile> {
  const payload: CacheFile = { generatedAt: new Date().toISOString(), records: records.map(repairRecordSources) };
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export function isCacheExpired(generatedAt: string, now = Date.now()): boolean {
  return now - new Date(generatedAt).getTime() >= CACHE_TTL_MS;
}
