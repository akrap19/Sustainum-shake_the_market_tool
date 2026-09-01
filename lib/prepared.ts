import { seedBrands } from "@/lib/seed";
import {
  companyWebsiteSource,
  guessedEmailSource,
  locationsMapSource,
  personSearchSource,
  registrationSearchSource,
} from "@/lib/source-urls";
import type { CompanyRecord, Segment, SustainabilityLevel } from "@/lib/types";

/**
 * Hand-reviewed baseline records for all 10 seed brands. Used for the prepared
 * dataset and as enrichment input when AI discovery is unavailable.
 */

/** Approximate UK site counts reviewed from public filings / store locators. */
const UK_LOCATIONS: Record<string, number> = {
  greggs: 2400,
  pret: 550,
  "caffe-nero": 650,
  gails: 130,
  itsu: 75,
  leon: 80,
  "joe-the-juice": 90,
  "coffee-1": 55,
  "black-sheep": 120,
  tortilla: 65,
};

const FIT_REASONS: Record<string, string> = {
  greggs: "Nationwide bakery chain with very high takeaway hot-drink volume across 2,000+ UK shops.",
  pret: "Food-to-go leader with dense UK estate and ongoing packaging sustainability commitments.",
  "caffe-nero": "Coffee-led operator with hundreds of UK cafés serving takeaway hot beverages daily.",
  gails: "Premium bakery/coffee estate with strong takeaway hot-drink sales in urban locations.",
  itsu: "Multi-site food-to-go chain with hot drinks alongside takeaway meals across the UK.",
  leon: "Naturally fast food operator with explicit sustainable packaging goals across UK sites.",
  "joe-the-juice": "Coffee and juice bar chain with growing UK footprint and disposable cup use.",
  "coffee-1": "Regional coffee house brand with 50+ UK sites and high takeaway cup volume.",
  "black-sheep": "Fast-growing UK coffee chain with significant hot-beverage takeaway demand.",
  tortilla: "UK Mexican QSR with 60+ restaurants and growing hot-drink / takeaway lines.",
};

const SUSTAINABILITY: Record<string, { level: SustainabilityLevel; note: string }> = {
  greggs: { level: "strong", note: "Public targets to reduce single-use plastics and improve recyclable packaging." },
  pret: { level: "strong", note: "Long-standing sustainability programme including packaging and cup initiatives." },
  "caffe-nero": { level: "moderate", note: "Reusable cup discounts and stated packaging improvement goals." },
  gails: { level: "moderate", note: "Artisan positioning with increasing focus on responsible packaging." },
  itsu: { level: "strong", note: "Health-led brand with published sustainable packaging commitments." },
  leon: { level: "strong", note: "Mission-led chain targeting compostable/recyclable takeaway materials." },
  "joe-the-juice": { level: "moderate", note: "Reusable cup programmes and stated reduction of disposable packaging." },
  "coffee-1": { level: "moderate", note: "Independent coffee chain with reusable cup incentives at many sites." },
  "black-sheep": { level: "moderate", note: "Growing chain with public interest in sustainable coffee packaging." },
  tortilla: { level: "moderate", note: "QSR operator reviewing takeaway packaging across its UK estate." },
};

const BUYING_ROLES: Record<Segment, string> = {
  Coffee: "Head of procurement / packaging for hot-beverage disposables",
  Bakery: "Operations or procurement lead for takeaway cup lids",
  "Food-to-go": "Packaging or sustainability buyer for food-service operations",
  QSR: "Procurement or operations lead for restaurant packaging",
};

function recordFromSeed(brand: (typeof seedBrands)[number]): CompanyRecord {
  return {
    id: brand.id,
    name: brand.name,
    website: brand.website,
    domain: brand.domain,
    segment: brand.segment,
    fitReason: FIT_REASONS[brand.id],
    isCurrentCustomer: false,
    registration: {
      sicCodes: brand.sicCodes,
      provenance: "manually-reviewed",
      source: registrationSearchSource(brand.name),
    },
    locations: {
      count: UK_LOCATIONS[brand.id],
      isEstimate: true,
      method: "Reviewed from public store-locator / filing estimates",
      provenance: "manually-reviewed",
      source: locationsMapSource(brand.name),
    },
    decisionMaker: {
      name: brand.personName,
      title: brand.personTitle,
      buyingRole: BUYING_ROLES[brand.segment],
      provenance: "manually-reviewed",
      source: personSearchSource(brand.personName, brand.name),
    },
    contact: {
      validationStatus: "unknown",
      validationMethod: "No email yet — named person from reviewed sources, mailbox checked live on refetch",
      provenance: "manually-reviewed",
      source: guessedEmailSource("unknown"),
    },
    sustainability: {
      ...SUSTAINABILITY[brand.id],
      provenance: "manually-reviewed",
      source: companyWebsiteSource(brand.website),
    },
  };
}

export function getPreparedRecords(): CompanyRecord[] {
  return seedBrands.map(recordFromSeed);
}

/** Brief asks for 8–10 opportunities; always surface 10 qualifying companies. */
export const TARGET_COMPANY_COUNT = 10;
