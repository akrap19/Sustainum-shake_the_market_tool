import {
  contactConfidenceFactor,
  locationFactor,
  MIN_UK_LOCATIONS,
  paperLidNeedFactor,
  segmentFitFactor,
  sustainabilityFactor,
} from "@/lib/scoring-factors";
import { deriveConfidence, deriveNeedsReview } from "@/lib/scoring-trust";
import type { CompanyRecord, ScoreBreakdown, ScoredCompany, ScoreFactor } from "@/lib/types";

/**
 * Deterministic priority scoring. Same inputs always produce the same score.
 */

function buildExplanation(company: CompanyRecord, factors: ScoreFactor[]): string {
  const top = [...factors].sort((a, b) => b.score - a.score).slice(0, 2);
  const strengths = top.map((f) => f.label.toLowerCase()).join(" and ");
  return `${company.name} ranks on ${strengths}: ${company.segment} operator with ~${company.locations.count.toLocaleString()} UK sites and ${company.sustainability.level} sustainability signal.`;
}

export function scoreCompany(company: CompanyRecord, rank = 0): ScoredCompany {
  const factors = [
    segmentFitFactor(company),
    locationFactor(company),
    paperLidNeedFactor(company),
    sustainabilityFactor(company),
    contactConfidenceFactor(company),
  ];
  const total = factors.reduce((sum, f) => f.score + sum, 0);
  const score: ScoreBreakdown = {
    total,
    rank,
    factors,
    explanation: buildExplanation(company, factors),
  };
  const needsReviewReasons = deriveNeedsReview(company);
  return {
    ...company,
    score,
    confidence: deriveConfidence(company),
    needsReview: needsReviewReasons.length > 0,
    needsReviewReasons,
  };
}

export function scoreAndRank(companies: CompanyRecord[]): ScoredCompany[] {
  return companies
    .map((c) => scoreCompany(c))
    .sort((a, b) => b.score.total - a.score.total || a.name.localeCompare(b.name))
    .map((company, index) => ({
      ...company,
      score: { ...company.score, rank: index + 1 },
    }));
}

export { MIN_UK_LOCATIONS };
