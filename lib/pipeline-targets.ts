import type { SeedBrand } from "@/lib/seed";
import type { AiCandidate } from "@/lib/sources/ai-discovery";
import { looksLikePersonalEmail, personNameFrom } from "@/lib/contact-quality";
import {
  companyPageSource,
  guessedEmailSource,
  locationsMapSource,
  personSearchSource,
  registrationSearchSource,
} from "@/lib/source-urls";
import type { CompanyRecord } from "@/lib/types";

/** Common shape the enrichment pass needs, from either the seed or AI discovery. */
export interface EnrichTarget {
  id: string;
  name: string;
  domain: string;
  osmBrand: string;
  sicCodes: string[];
  /** Gemini-suggested emails (inferred) — verified later by a real mailbox check. */
  emailCandidates?: string[];
  /** Staff mailbox domains when they differ from the public website. */
  mailboxDomains?: string[];
  /** Gemini-suggested Companies House number — confirmed by the register before Live. */
  companyNumberHint?: string;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function targetFromSeed(brand: SeedBrand): EnrichTarget {
  return { id: brand.id, name: brand.name, domain: brand.domain, osmBrand: brand.osmBrand, sicCodes: brand.sicCodes };
}

export function targetFromCandidate(c: AiCandidate): EnrichTarget {
  const emailCandidates = (c.suggestedEmails ?? []).map((e) => e.trim()).filter((e) => looksLikePersonalEmail(e));
  const mailboxDomains = (c.mailboxDomains ?? []).map((d) => d.trim().toLowerCase()).filter(Boolean);
  const osmBrand = c.name.replace(/\s+(UK|Coffee|Café|Cafe)$/i, "").trim() || c.name;
  const companyNumberHint = c.companiesHouseNumber?.trim() || undefined;
  return { id: slugify(c.name), name: c.name, domain: c.domain, osmBrand, sicCodes: [], emailCandidates, mailboxDomains, companyNumberHint };
}

/** Build a base record from an AI candidate. All AI-sourced fields are labelled `inferred`. */
export function candidateToRecord(c: AiCandidate): CompanyRecord {
  const rawName = c.decisionMakerName?.trim() ?? "";
  const name = personNameFrom(rawName);
  return {
    id: slugify(c.name),
    name: c.name,
    website: c.website,
    domain: c.domain,
    segment: c.segment,
    fitReason: c.whyItFits,
    isCurrentCustomer: false,
    registration: {
      sicCodes: [],
      provenance: "inferred",
      source: registrationSearchSource(c.name),
    },
    locations: {
      count: Math.round(c.estimatedUkLocations),
      isEstimate: true,
      method: "AI estimate (Gemini) — confirm live",
      provenance: "inferred",
      source: locationsMapSource(c.name),
    },
    decisionMaker: {
      name,
      title: c.decisionMakerTitle,
      buyingRole: c.buyingRole,
      provenance: "inferred",
      source: personSearchSource(name, c.name),
    },
    contact: {
      validationStatus: "unknown",
      validationMethod: "No email yet — suggested by Gemini and verified by a mailbox check",
      provenance: "inferred",
      source: guessedEmailSource("unknown"),
    },
    sustainability: {
      level: c.sustainabilityLevel,
      note: c.sustainabilityNote,
      provenance: "inferred",
      source: companyPageSource(c.sourceUrl, c.website, c.domain),
    },
  };
}
