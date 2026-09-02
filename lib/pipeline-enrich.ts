import { findPrevious, normalizeContact, preferContact, preferDecisionMaker } from "@/lib/contact-merge";
import { resolvePersonContact } from "@/lib/pipeline-email";
import { getPreparedRecords } from "@/lib/prepared";
import { MIN_UK_LOCATIONS } from "@/lib/scoring-factors";
import { repairRecordSources } from "@/lib/source-repair";
import * as ch from "@/lib/sources/companies-house";
import { countUkLocations } from "@/lib/sources/overpass";
import { confirmSustainability } from "@/lib/sources/sustainability";
import { locationsMapSource } from "@/lib/source-urls";
import type { EnrichTarget } from "@/lib/pipeline-targets";
import type { CompanyRecord, CompanyRegistration, LocationEvidence, Provenance } from "@/lib/types";

function osmBrands(target: EnrichTarget): string[] {
  const cleaned = target.osmBrand.replace(/\s+(UK|Coffee|Café|Cafe)$/i, "").trim();
  const short = cleaned.split(/\s+/).slice(0, 2).join(" ");
  return [...new Set([cleaned || target.osmBrand, short])].filter((b) => b.length >= 2);
}

function isGrounded<T extends { provenance: Provenance }>(value?: T): value is T {
  return Boolean(value && value.provenance !== "inferred" && value.provenance !== "mocked");
}

function preferGrounded<T extends { provenance: Provenance }>(live: T, previous?: T, prepared?: T): T {
  if (isGrounded(live)) return live;
  if (isGrounded(previous)) return previous;
  if (isGrounded(prepared)) return prepared;
  return live;
}

function preparedOf(target: EnrichTarget) {
  return findPrevious(getPreparedRecords(), target);
}

export async function enrichRegistration(target: EnrichTarget, base: CompanyRecord, previous?: CompanyRecord): Promise<CompanyRegistration> {
  const match = await ch.searchCompany(target.name, target.companyNumberHint).catch(() => null);
  const live: CompanyRegistration = match
    ? { companyNumber: match.companyNumber, status: match.status, sicCodes: match.sicCodes.length ? match.sicCodes : base.registration.sicCodes, provenance: "live", source: { label: "Companies House profile", url: match.profileUrl } }
    : base.registration;
  return preferGrounded(live, previous?.registration, preparedOf(target)?.registration);
}

export async function enrichLocations(target: EnrichTarget, base: CompanyRecord, previous?: CompanyRecord): Promise<LocationEvidence> {
  let best = 0;
  for (const brand of osmBrands(target)) {
    const result = await countUkLocations(brand).catch(() => null);
    if (result && result.count > best) best = result.count;
    if (best >= MIN_UK_LOCATIONS) break;
  }
  const live: LocationEvidence =
    best === 0
      ? base.locations
      : { count: best, isEstimate: true, method: "Live OpenStreetMap Overpass brand node/way count (approximate)", provenance: "live", source: locationsMapSource(target.name, true) };
  return preferGrounded(live, previous?.locations, preparedOf(target)?.locations);
}

export async function enrichTarget(
  target: EnrichTarget,
  base: CompanyRecord,
  previous?: CompanyRecord,
): Promise<CompanyRecord> {
  const origin = base.website.replace(/\/$/, "");
  const prepared = preparedOf(target);
  const [registration, locations, confirmed] = await Promise.all([
    enrichRegistration(target, base, previous),
    enrichLocations(target, base, previous),
    confirmSustainability(base.sustainability, target.domain, [
      base.sustainability.source?.url,
      origin,
      `${origin}/sustainability`,
      `${origin}/ethics`,
    ]),
  ]);
  const sustainability = preferGrounded(confirmed, previous?.sustainability, prepared?.sustainability);
  const withReg: CompanyRecord = { ...base, registration, locations, sustainability };
  const officers = registration.companyNumber
    ? await ch.getActiveOfficers(registration.companyNumber).catch(() => [])
    : [];
  const personAndContact = await resolvePersonContact(target, withReg, officers, previous).catch(() => ({
    decisionMaker: withReg.decisionMaker,
    contact: withReg.contact,
  }));
  return repairRecordSources({
    ...withReg,
    decisionMaker: preferDecisionMaker(previous?.decisionMaker, personAndContact.decisionMaker),
    contact: normalizeContact(preferContact(previous?.contact, personAndContact.contact)),
  });
}
