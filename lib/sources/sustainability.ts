import { urlBelongsToDomain } from "@/lib/source-urls";
import type { SustainabilitySignal } from "@/lib/types";

const PACKAGING =
  /packag|pfas|fibre|fiber|recycl|compost|single[\s-]?use|cup lid|moulded|molded/i;

function uniqueHttpUrls(urls: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 5) break;
  }
  return out;
}

async function fetchPageText(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": "SustainiumShake/1.0", Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const type = res.headers.get("content-type") ?? "";
  if (!/html|text|xml/i.test(type) && type) return null;
  const buf = await res.arrayBuffer().catch(() => null);
  if (!buf) return null;
  return new TextDecoder().decode(buf.slice(0, 80_000)).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

/** Promote a Gemini sustainability note to Live only when a company page confirms packaging language. */
export async function confirmSustainability(
  current: SustainabilitySignal,
  domain: string,
  urls: Array<string | undefined>,
): Promise<SustainabilitySignal> {
  const pages = uniqueHttpUrls(urls).filter((url) => urlBelongsToDomain(url, domain));
  for (const url of pages) {
    const text = await fetchPageText(url);
    if (text && PACKAGING.test(text)) {
      return {
        ...current,
        provenance: "live",
        source: { label: "Public page (fetched)", url },
      };
    }
  }
  return current;
}
