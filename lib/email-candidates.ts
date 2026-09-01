import type { EnrichTarget } from "@/lib/pipeline-targets";
import { aiSourceLabel } from "@/lib/sources/ai-discovery";
import * as hunter from "@/lib/sources/hunter";
import { EMAIL_STYLES, emailsFromPersonName, splitPersonName } from "@/lib/email-patterns";
import { expandMailboxDomains } from "@/lib/email-domains";
import { looksLikePersonalEmail } from "@/lib/contact-quality";
import { candidatesFromPrevious } from "@/lib/contact-merge";
import type { CompanyRecord } from "@/lib/types";
import type { CompaniesHouseOfficer } from "@/lib/sources/companies-house";

export interface EmailCandidate {
  email: string;
  sourceLabel: string;
  sourceUrl?: string;
  confidence?: number;
  firstName?: string;
  lastName?: string;
  position?: string;
  kind: "personal" | "role";
}

export interface EmailExtras {
  emails?: string[];
  domains?: string[];
}

/** Named-person addresses for the decision-maker, then a couple of officers. */
export async function findEmailCandidates(
  target: EnrichTarget,
  base: CompanyRecord,
  officers: CompaniesHouseOfficer[] = [],
  previous?: CompanyRecord,
  extras: EmailExtras = {},
): Promise<EmailCandidate[]> {
  const seen = new Set<string>();
  const candidates: EmailCandidate[] = [];
  const domains = expandMailboxDomains(target.domain, [
    ...(target.mailboxDomains ?? []),
    ...(extras.domains ?? []),
    ...(extras.emails ?? []),
    ...(target.emailCandidates ?? []),
  ]);

  function add(candidate: EmailCandidate) {
    const email = candidate.email.trim().toLowerCase();
    if (!looksLikePersonalEmail(email) || seen.has(email)) return;
    seen.add(email);
    candidates.push({ ...candidate, email });
  }

  function addFromName(
    fullName: string,
    sourceLabel: string,
    sourceUrl: string | undefined,
    position: string | undefined,
    styles = EMAIL_STYLES,
  ) {
    const parts = splitPersonName(fullName);
    for (const style of styles) {
      for (const domain of domains) {
        for (const email of emailsFromPersonName(fullName, domain, style)) {
          add({ email, sourceLabel, sourceUrl, firstName: parts?.firstName, lastName: parts?.lastName, position, kind: "personal" });
        }
      }
    }
  }

  for (const candidate of candidatesFromPrevious(previous)) add(candidate);
  const named = splitPersonName(base.decisionMaker.name);
  for (const email of [...(target.emailCandidates ?? []), ...(extras.emails ?? [])]) {
    add({
      email,
      sourceLabel: aiSourceLabel,
      sourceUrl: undefined,
      firstName: named?.firstName,
      lastName: named?.lastName,
      position: base.decisionMaker.title,
      kind: "personal",
    });
  }

  if (base.decisionMaker.name) {
    addFromName(base.decisionMaker.name, aiSourceLabel, undefined, base.decisionMaker.title);
  }
  for (const officer of officers.slice(0, 2)) {
    addFromName(officer.name, "Companies House officers", officer.appointmentsUrl, officer.role, ["full", "first", "initial"]);
  }

  if (hunter.isConfigured()) {
    for (const person of await hunter.findDecisionMakerCandidates(target.domain).catch(() => [])) {
      add({ email: person.email, sourceLabel: "Hunter.io Domain Search", sourceUrl: person.sourceUrl, confidence: person.confidence, firstName: person.firstName, lastName: person.lastName, position: person.position, kind: "personal" });
    }
  }
  return candidates;
}
