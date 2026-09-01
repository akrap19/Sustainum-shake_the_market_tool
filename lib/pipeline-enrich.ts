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
import type { CompanyRecord, CompanyRegistration, LocationEvidence } from "@/lib/types";

function osmBrands(target: EnrichTarget): string[] {
  const cleaned = target.osmBrand.replace(/\s+(UK|Coffee|Café|Cafe)$/i, "").trim();
  const short = cleaned.split(/\s+/).slice(0, 2).join(" ");
  return [...new Set([cleaned || target.osmBrand, short])].filter((b) => b.length >= 2);
}

export async function enrichRegistration(target: EnrichTarget, base: CompanyRecord): Promise<CompanyRegistration> {
  const match = await ch.searchCompany(target.name, target.companyNumberHint).catch(() => null);
  if (!match) return base.registration;
  return {
    companyNumber: match.companyNumber,
    status: match.status,
    sicCodes: match.sicCodes.length ? match.sicCodes : base.registration.sicCodes,
    provenance: "live",
    source: { label: "Companies House profile", url: match.profileUrl },
  };
}

function isGrounded(locations?: LocationEvidence): locations is LocationEvidence {
  return Boolean(locations && locations.count > 0 && locations.provenance !== "inferred" && locations.provenance !== "mocked");
}

/** OSM first; if mirrors fail (common on Vercel), keep a reviewed/live count instead of Gemini's guess. */
function fallbackLocations(target: EnrichTarget, base: CompanyRecord, previous?: CompanyRecord): LocationEvidence {
  if (previous && isGrounded(previous.locations)) return previous.locations;
  const prepared = findPrevious(getPreparedRecords(), target);
  if (prepared && isGrounded(prepared.locations)) return prepared.locations;
  return base.locations;
}

export async function enrichLocations(
  target: EnrichTarget,
  base: CompanyRecord,
  previous?: CompanyRecord,
): Promise<LocationEvidence> {
  let best = 0;
  for (const brand of osmBrands(target)) {
    const result = await countUkLocations(brand).catch(() => null);
    if (result && result.count > best) best = result.count;
    if (best >= MIN_UK_LOCATIONS) break;
  }
  if (best === 0) return fallbackLocations(target, base, previous);
  return {
    count: best,
    isEstimate: true,
    method: "Live OpenStreetMap Overpass brand node/way count (approximate)",
    provenance: "live",
    source: locationsMapSource(target.name, true),
  };
}

export async function enrichTarget(
  target: EnrichTarget,
  base: CompanyRecord,
  previous?: CompanyRecord,
): Promise<CompanyRecord> {
  const origin = base.website.replace(/\/$/, "");
  const [registration, locations, sustainability] = await Promise.all([
    enrichRegistration(target, base),
    enrichLocations(target, base, previous),
    confirmSustainability(base.sustainability, target.domain, [
      base.sustainability.source?.url,
      origin,
      `${origin}/sustainability`,
      `${origin}/ethics`,
    ]),
  ]);
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
