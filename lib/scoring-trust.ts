import { isPlaceholderDecisionMakerName } from "@/lib/decision-maker";
import type { CompanyRecord, ConfidenceLevel } from "@/lib/types";

export function deriveConfidence(company: CompanyRecord): ConfidenceLevel {
  if (company.contact.validationStatus === "verified") return "high";
  if (company.contact.validationStatus === "invalid" || company.contact.validationStatus === "unknown") {
    return "low";
  }
  const inferredKeyField =
    company.locations.provenance === "inferred" || company.decisionMaker.provenance === "inferred";
  return inferredKeyField ? "low" : "medium";
}

export function deriveNeedsReview(company: CompanyRecord): string[] {
  const reasons: string[] = [];
  if (company.contact.validationStatus !== "verified") {
    reasons.push(`Email is ${company.contact.validationStatus} — verify before outreach.`);
  }
  if (company.locations.provenance === "inferred") {
    reasons.push("UK location count is an AI estimate — not confirmed by OpenStreetMap.");
  }
  if (company.decisionMaker.provenance === "inferred") {
    reasons.push("Decision-maker inferred by role — confirm the named individual.");
  }
  if (!company.decisionMaker.name.trim() || isPlaceholderDecisionMakerName(company.decisionMaker.name)) {
    reasons.push("Decision-maker name not resolved — confirm before outreach.");
  }
  if (company.registration.status && company.registration.status !== "active") {
    reasons.push(`Companies House status is ${company.registration.status}.`);
  }
  if (company.sustainability.provenance === "inferred") {
    reasons.push("Sustainability signal not confirmed on a public page.");
  }
  return reasons;
}
