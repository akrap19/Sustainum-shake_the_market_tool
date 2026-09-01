/**
 * Optional Hunter.io Domain Search — extra email candidates when HUNTER_API_KEY
 * is set. Mailbox verification now lives in lib/sources/email-verifier.ts.
 * Docs: https://hunter.io/api-documentation/v2
 */

const BASE_URL = "https://api.hunter.io/v2";

/** Titles that indicate a packaging / procurement buying role, best first. */
const BUYING_ROLE_HINTS = [
  "procurement",
  "supply chain",
  "packaging",
  "purchasing",
  "operations",
  "sustainability",
  "commercial",
];

export interface HunterPerson {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence?: number;
  sourceUrl?: string;
}

/**
 * Return domain contacts ranked so the most relevant buying role comes first.
 * The pipeline verifies these in order and picks the first deliverable email,
 * so a ranked list (not just the top hit) enables trying alternates.
 */
export async function findDecisionMakerCandidates(domain: string, limit = 10): Promise<HunterPerson[]> {
  const key = process.env.HUNTER_API_KEY;
  if (!key) return [];

  // Hunter's free plan caps domain-search results at 10 emails; requesting more
  // returns HTTP 400 (pagination_error), so keep the limit within plan bounds.
  const url = `${BASE_URL}/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    data?: { emails?: Array<{ value: string; first_name?: string; last_name?: string; position?: string; confidence?: number; sources?: Array<{ uri?: string }> }> };
  };
  const emails = data.data?.emails ?? [];

  return [...emails]
    .sort((a, b) => rankPosition(b.position) - rankPosition(a.position) || (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, limit)
    .map((e) => ({
      email: e.value,
      firstName: e.first_name,
      lastName: e.last_name,
      position: e.position,
      confidence: e.confidence,
      sourceUrl: e.sources?.[0]?.uri,
    }));
}

export async function findDecisionMaker(domain: string): Promise<HunterPerson | null> {
  const candidates = await findDecisionMakerCandidates(domain, 1);
  return candidates[0] ?? null;
}

function rankPosition(position?: string): number {
  if (!position) return 0;
  const lower = position.toLowerCase();
  const hit = BUYING_ROLE_HINTS.findIndex((hint) => lower.includes(hint));
  return hit === -1 ? 0 : BUYING_ROLE_HINTS.length - hit;
}

export type HunterVerifyResult = "deliverable" | "undeliverable" | "risky" | "unknown";

export interface HunterVerification {
  result: HunterVerifyResult;
  score?: number;
}

export async function verifyEmail(email: string): Promise<HunterVerification | null> {
  const key = process.env.HUNTER_API_KEY;
  if (!key) return null;

  const url = `${BASE_URL}/email-verifier?email=${encodeURIComponent(email)}&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as { data?: { result?: HunterVerifyResult; score?: number } };
  if (!data.data?.result) return null;
  return { result: data.data.result, score: data.data.score };
}

export function isConfigured(): boolean {
  return Boolean(process.env.HUNTER_API_KEY);
}
