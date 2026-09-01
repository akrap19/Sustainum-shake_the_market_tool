import type { SourceRef, ValidationStatus } from "@/lib/types";

const CH = "https://find-and-update.company-information.service.gov.uk";

export function companiesHouseSearchUrl(name: string): string {
  return `${CH}/search/companies?q=${encodeURIComponent(name)}`;
}

export function googleMapsUkUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} UK`)}`;
}

export function linkedInPersonSearchUrl(name: string, company: string): string {
  const q = `${name} ${company}`.trim();
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}

export function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return undefined;
  }
}

export function isHttpUrl(url?: string): url is string {
  return Boolean(url && /^https?:\/\//i.test(url) && hostnameOf(url) !== "sustainium.se");
}

export function urlBelongsToDomain(url: string | undefined, domain: string): boolean {
  const host = url ? hostnameOf(url) : undefined;
  if (!host) return false;
  const d = domain.replace(/^www\./i, "").toLowerCase();
  return host === d || host.endsWith(`.${d}`);
}

export function registrationSearchSource(name: string): SourceRef {
  return { label: "Companies House register (search)", url: companiesHouseSearchUrl(name) };
}

export function locationsMapSource(name: string, live = false): SourceRef {
  return {
    label: live ? "UK locations on Google Maps (OSM count is approximate)" : "UK store map (public locator estimate)",
    url: googleMapsUkUrl(name),
  };
}

export function personSearchSource(name: string, company: string): SourceRef {
  if (!name.trim()) return { label: "Person not yet sourced" };
  return { label: "LinkedIn people search — verify before outreach", url: linkedInPersonSearchUrl(name, company) };
}

export function companyWebsiteSource(website: string, label = "Company website"): SourceRef {
  return { label, url: website };
}

export function companyPageSource(url: string | undefined, website: string, domain: string): SourceRef {
  if (isHttpUrl(url) && urlBelongsToDomain(url, domain)) return { label: "Public page (company site)", url };
  return companyWebsiteSource(website);
}

/** Gemini proposed the address; the mailbox check lives on `validationMethod`. */
export function guessedEmailSource(status?: ValidationStatus): SourceRef {
  if (status === "verified") {
    return { label: "AI discovery (Google Gemini)" };
  }
  return { label: "AI discovery (Google Gemini) — mailbox not confirmed" };
}
