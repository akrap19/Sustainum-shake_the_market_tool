/**
 * UK Companies House Public Data API HTTP helper.
 * Auth: HTTP Basic with the API key as username and a blank password.
 * Docs: https://developer.company-information.service.gov.uk
 */

const BASE_URL = "https://api.company-information.service.gov.uk";

function headers(): HeadersInit | null {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) return null;
  return {
    Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
    Accept: "application/json",
    "User-Agent": "SustainiumShake/1.0",
  };
}

let chAuthWarned = false;

export async function companiesHouseGet(path: string): Promise<unknown | null> {
  const auth = headers();
  if (!auth) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${BASE_URL}${path}`, { headers: auth, signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (res?.ok) return res.json();
    if (res?.status === 401) {
      if (!chAuthWarned) {
        chAuthWarned = true;
        console.error("Companies House returned 401 — use a REST API key from developer.company-information.service.gov.uk, not a streaming key.");
      }
      return null;
    }
    if (attempt === 0 && (!res || res.status === 429)) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    return null;
  }
  return null;
}

export function isConfigured(): boolean {
  return Boolean(process.env.COMPANIES_HOUSE_API_KEY);
}
