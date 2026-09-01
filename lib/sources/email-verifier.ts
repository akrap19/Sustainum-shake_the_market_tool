/**
 * Email verification: vrfymail (primary, 5k/mo free) then keyless fallbacks.
 * An LLM cannot verify a mailbox — only these checks set Verified status.
 *
 * Key: VRFYMAIL_API_KEY (optional — Mailverdict + Rapid Email Verifier need none).
 */

export type VerifyResult = "deliverable" | "undeliverable" | "risky" | "unknown";

export interface EmailVerification {
  result: VerifyResult;
  score?: number;
  provider: "vrfymail" | "mailverdict";
}

const LABELS: Record<EmailVerification["provider"], string> = {
  vrfymail: "vrfymail mailbox check (SMTP + MX)",
  mailverdict: "Mailverdict (MX + role/disposable checks)",
};

export function verificationMethodLabel(v: EmailVerification, tries: number): string {
  return `${LABELS[v.provider]}, score ${v.score ?? "n/a"}, ${tries} candidate(s) checked`;
}

export function isPrimaryConfigured(): boolean {
  return Boolean(process.env.VRFYMAIL_API_KEY);
}

export function isConfigured(): boolean {
  return true;
}

export function verifyToStatus(result: VerifyResult): "verified" | "invalid" | "unverified" | "unknown" {
  const map: Record<VerifyResult, "verified" | "invalid" | "unverified" | "unknown"> = {
    deliverable: "verified",
    undeliverable: "invalid",
    risky: "unverified",
    // Inconclusive SMTP still means we have an address — Unverified, not Unknown.
    unknown: "unverified",
  };
  return map[result];
}

async function json(url: string, init?: RequestInit): Promise<unknown | null> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8_000) });
  return res.ok ? res.json() : null;
}

async function vrfymail(email: string, strict: boolean): Promise<EmailVerification | null> {
  const key = process.env.VRFYMAIL_API_KEY;
  if (!key) return null;
  const data = (await json("https://vrfymail.com/v1/check", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, strict }),
  })) as { result?: VerifyResult; score?: number } | null;
  if (!data?.result) return null;
  const score = typeof data.score === "number" ? Math.round(data.score <= 1 ? data.score * 100 : data.score) : undefined;
  return { result: data.result, score, provider: "vrfymail" };
}

async function mailverdict(email: string): Promise<EmailVerification | null> {
  const data = (await json(`https://api.mailverdict.dev/v1/check?email=${encodeURIComponent(email)}`)) as {
    result?: VerifyResult;
    score?: number;
  } | null;
  if (!data?.result) return null;
  // Mailverdict is MX / disposable / role — not SMTP. Do not treat as a mailbox proof.
  const result: VerifyResult = data.result === "deliverable" ? "risky" : data.result;
  return { result, score: data.score, provider: "mailverdict" };
}

/** Strict SMTP first; retry without strict if unknown, then Mailverdict. */
export async function verifyEmail(email: string): Promise<EmailVerification | null> {
  const strict = await vrfymail(email, true).catch(() => null);
  if (strict && strict.result !== "unknown") return strict;
  const loose = await vrfymail(email, false).catch(() => null);
  if (loose && loose.result !== "unknown") return loose;
  const fallback = await mailverdict(email).catch(() => null);
  return loose ?? strict ?? fallback;
}
