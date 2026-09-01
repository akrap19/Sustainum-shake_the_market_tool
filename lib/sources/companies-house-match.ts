/** Name matching for Companies House search — keep false positives out of Live. */

const STOP = /^(uk|the|and|plc|ltd|limited|coffee|cafe|café|group|holdings|restaurants?)$/i;

export const MIN_TITLE_RANK = 5;

export function profileUrl(companyNumber: string): string {
  return `https://find-and-update.company-information.service.gov.uk/company/${companyNumber}`;
}

export function normalizeCompanyNumber(value?: string | null): string | undefined {
  const compact = value?.toUpperCase().replace(/[\s.-]/g, "") ?? "";
  if (!/^(?:[A-Z]{2})?\d{6,8}$/.test(compact)) return undefined;
  return /^\d+$/.test(compact) ? compact.padStart(8, "0") : compact;
}

export function searchQueries(name: string): string[] {
  const cleaned = name
    .replace(/\s+uk$/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " ")
    .replace(/\s+(plc|ltd|limited)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const noSegment = cleaned.replace(/\s+(coffee|café|cafe|group|holdings|restaurants?)$/i, "").trim();
  const short = noSegment.split(" ").slice(0, 2).join(" ");
  return [...new Set([cleaned || name, noSegment, short])].filter((q) => q.length >= 2);
}

export function brandTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.test(word));
}

export function titleMatchesBrand(title: string, brand: string): boolean {
  const tokens = brandTokens(brand);
  const t = title.toLowerCase();
  return tokens.length > 0 && tokens.every((token) => t.includes(token));
}

export function rankTitle(title: string | undefined, query: string, type?: string): number {
  const t = (title ?? "").toLowerCase().replace(/\s+(ltd|limited|plc)\.?$/, "");
  const q = query.toLowerCase();
  let score = t === q ? 10 : t.startsWith(q) ? 6 : t.includes(q) ? 2 : 0;
  if (titleMatchesBrand(t, q)) score = Math.max(score, 5);
  return score + (type === "plc" ? 2 : 0);
}

export interface SearchHit {
  title?: string;
  company_number?: string;
  company_status?: string;
  company_type?: string;
}

export function pickBestMatch(pages: Array<{ query: string; items: SearchHit[] }>): SearchHit | undefined {
  let best: { rank: number; item: SearchHit } | undefined;
  for (const { query, items } of pages) {
    const active = items.filter((i) => i.company_status === "active");
    for (const item of active.length ? active : items) {
      const rank = rankTitle(item.title, query, item.company_type);
      if (rank >= MIN_TITLE_RANK && (!best || rank > best.rank)) best = { rank, item };
    }
  }
  return best?.item;
}
