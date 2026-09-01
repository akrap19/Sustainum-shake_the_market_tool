import {
  companyWebsiteSource,
  guessedEmailSource,
  hostnameOf,
  isHttpUrl,
  locationsMapSource,
  personSearchSource,
  registrationSearchSource,
  urlBelongsToDomain,
} from "@/lib/source-urls";
import type { CompanyRecord, SourceRef } from "@/lib/types";

function isPersonUrl(url?: string): boolean {
  const host = url && isHttpUrl(url) ? hostnameOf(url) : undefined;
  return Boolean(host && (host.includes("linkedin.com") || host.includes("company-information.service.gov.uk")));
}

function keepContactSource(source: SourceRef): boolean {
  if (!isHttpUrl(source.url)) return false;
  if (source.label.includes("Hunter.io")) return true;
  return isPersonUrl(source.url);
}

function isMapOrOsm(url?: string): boolean {
  const host = url && isHttpUrl(url) ? hostnameOf(url) : undefined;
  return host === "google.com" || host === "overpass-turbo.eu" || host === "openstreetmap.org";
}

/** Point each field at a URL that actually supports that claim. */
export function repairRecordSources(record: CompanyRecord): CompanyRecord {
  const { name, website, domain, decisionMaker } = record;
  const sustUrl = record.sustainability.source?.url;
  const sustOk = isHttpUrl(sustUrl) && urlBelongsToDomain(sustUrl, domain);

  return {
    ...record,
    registration: isHttpUrl(record.registration.source.url)
      ? record.registration
      : { ...record.registration, source: registrationSearchSource(name) },
    locations: {
      ...record.locations,
      source: isMapOrOsm(record.locations.source.url)
        ? record.locations.source
        : locationsMapSource(name, record.locations.provenance === "live"),
    },
    decisionMaker: {
      ...decisionMaker,
      source: isPersonUrl(decisionMaker.source.url) ? decisionMaker.source : personSearchSource(decisionMaker.name, name),
    },
    contact: {
      ...record.contact,
      source: keepContactSource(record.contact.source)
        ? record.contact.source
        : guessedEmailSource(record.contact.validationStatus),
    },
    sustainability: sustOk
      ? record.sustainability
      : {
          ...record.sustainability,
          provenance: record.sustainability.provenance === "live" ? "manually-reviewed" : record.sustainability.provenance,
          source: companyWebsiteSource(website),
        },
  };
}
