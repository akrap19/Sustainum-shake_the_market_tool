import type { CompanyRecord, ScoreFactor } from "@/lib/types";
import { contactEvidenceSentence } from "@/lib/contact-evidence";

export const MIN_UK_LOCATIONS = 20;

export function segmentFitFactor(company: CompanyRecord): ScoreFactor {
  const map: Record<CompanyRecord["segment"], { score: number; detail: string }> = {
    Coffee: { score: 25, detail: "Coffee-led operator: direct fit for hot-beverage paper lids." },
    "Food-to-go": { score: 22, detail: "Food-to-go operator serving hot drinks in disposable cups." },
    Bakery: { score: 20, detail: "Bakery/coffee operator with strong takeaway hot-drink volume." },
    QSR: { score: 18, detail: "QSR operator with hot-drink and takeaway lines." },
  };
  const { score, detail } = map[company.segment];
  return { key: "segment", label: "Segment fit", score, max: 25, detail };
}

export function locationFactor(company: CompanyRecord): ScoreFactor {
  const count = company.locations.count;
  const tiers: Array<[number, number]> = [
    [1000, 25],
    [500, 22],
    [200, 19],
    [100, 16],
    [50, 13],
    [MIN_UK_LOCATIONS, 10],
  ];
  const score = tiers.find(([threshold]) => count >= threshold)?.[1] ?? 4;
  const estimate =
    company.locations.provenance === "inferred"
      ? " (AI estimate — unconfirmed)"
      : company.locations.isEstimate
        ? " (live OSM, approximate)"
        : "";
  return {
    key: "locations",
    label: "UK location scale",
    score,
    max: 25,
    detail: `~${count.toLocaleString()} UK locations${estimate}; brief requires ${MIN_UK_LOCATIONS}+.`,
  };
}

export function paperLidNeedFactor(company: CompanyRecord): ScoreFactor {
  const map: Record<CompanyRecord["segment"], number> = {
    Coffee: 20,
    Bakery: 17,
    "Food-to-go": 16,
    QSR: 12,
  };
  return {
    key: "need",
    label: "Paper-lid need",
    score: map[company.segment],
    max: 20,
    detail: "Estimated hot-beverage cup volume requiring 80/90 mm lids.",
  };
}

export function sustainabilityFactor(company: CompanyRecord): ScoreFactor {
  const map = { strong: 15, moderate: 10, unknown: 6, none: 4 } as const;
  return {
    key: "sustainability",
    label: "Sustainability signal",
    score: map[company.sustainability.level],
    max: 15,
    detail: company.sustainability.note,
  };
}

export function contactConfidenceFactor(company: CompanyRecord): ScoreFactor {
  const map = { verified: 15, unverified: 8, unknown: 4, invalid: 0 } as const;
  return {
    key: "contact",
    label: "Contact confidence",
    score: map[company.contact.validationStatus],
    max: 15,
    detail: `Email ${company.contact.validationStatus} via ${contactEvidenceSentence(company.contact)}`,
  };
}
