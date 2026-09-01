import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { repairRecordSources } from "@/lib/source-repair";
import type { CompanyRecord } from "@/lib/types";

/**
 * Last live pull. Locally this is data/cache.json; on Vercel it is a Blob
 * object at the same pathname (the deployment filesystem is read-only).
 */

const CACHE_PATH = path.join(process.cwd(), "data", "cache.json");
const BLOB_PATH = "data/cache.json";
const BLOB_ACCESS = { access: "public" as const };

/** Live pulls are reused without auto-refresh for this long. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheFile {
  generatedAt: string;
  records: CompanyRecord[];
}

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
}

function parseCache(raw: string): CacheFile {
  const parsed = JSON.parse(raw) as CacheFile;
  return { ...parsed, records: parsed.records.map(repairRecordSources) };
}

async function readLocalCache(): Promise<CacheFile | null> {
  try {
    return parseCache(await fs.readFile(CACHE_PATH, "utf8"));
  } catch {
    return null;
  }
}

async function readBlobCache(): Promise<CacheFile | null> {
  try {
    const result = await get(BLOB_PATH, { ...BLOB_ACCESS, useCache: false });
    if (!result?.stream) return null;
    return parseCache(await new Response(result.stream).text());
  } catch {
    return null;
  }
}

export async function readCache(): Promise<CacheFile | null> {
  if (blobEnabled()) {
    const fromBlob = await readBlobCache();
    if (fromBlob) return fromBlob;
  }
  return readLocalCache();
}

export async function writeCache(records: CompanyRecord[]): Promise<CacheFile> {
  const payload: CacheFile = { generatedAt: new Date().toISOString(), records: records.map(repairRecordSources) };
  if (blobEnabled()) {
    try {
      await put(BLOB_PATH, JSON.stringify(payload), {
        ...BLOB_ACCESS,
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      });
    } catch (error) {
      console.error("Blob cache write failed:", error instanceof Error ? error.message : error);
    }
  }
  if (!process.env.VERCEL) {
    try {
      await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
      await fs.writeFile(CACHE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    } catch (error) {
      console.error("Local cache write failed:", error instanceof Error ? error.message : error);
    }
  }
  return payload;
}

export function isCacheExpired(generatedAt: string, now = Date.now()): boolean {
  return now - new Date(generatedAt).getTime() >= CACHE_TTL_MS;
}
