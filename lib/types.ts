/**
 * Domain types for the "Shake the Market" preview tool.
 *
 * Every enriched field carries a `provenance` label so the UI can honestly
 * show whether a value is live, cached, inferred, manually reviewed or mocked.
 */

export type Provenance =
  | "live"
  | "cached"
  | "inferred"
  | "manually-reviewed"
  | "mocked";

export type ValidationStatus = "verified" | "unverified" | "unknown" | "invalid";

export type ConfidenceLevel = "high" | "medium" | "low";

export type Segment = "Coffee" | "Food-to-go" | "QSR" | "Bakery";

export type SustainabilityLevel = "strong" | "moderate" | "none" | "unknown";

export interface SourceRef {
  label: string;
  url?: string;
}

export interface CompanyRegistration {
  companyNumber?: string;
  status?: string;
  sicCodes: string[];
  provenance: Provenance;
  source: SourceRef;
}

export interface LocationEvidence {
  count: number;
  isEstimate: boolean;
  method: string;
  provenance: Provenance;
  source: SourceRef;
}

export interface DecisionMaker {
  name: string;
  title: string;
  buyingRole: string;
  provenance: Provenance;
  source: SourceRef;
}

export interface Contact {
  email?: string;
  phone?: string;
  validationStatus: ValidationStatus;
  validationMethod: string;
  confidenceScore?: number;
  provenance: Provenance;
  source: SourceRef;
  /** Personal addresses worth remembering — never role inboxes. */
  knownEmails?: string[];
}

export interface SustainabilitySignal {
  level: SustainabilityLevel;
  note: string;
  provenance: Provenance;
  source?: SourceRef;
}

export interface ScoreFactor {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface ScoreBreakdown {
  total: number;
  rank: number;
  factors: ScoreFactor[];
  explanation: string;
}

/** Raw enriched record before deterministic scoring is applied. */
export interface CompanyRecord {
  id: string;
  name: string;
  website: string;
  domain: string;
  segment: Segment;
  fitReason: string;
  isCurrentCustomer: boolean;
  registration: CompanyRegistration;
  locations: LocationEvidence;
  decisionMaker: DecisionMaker;
  contact: Contact;
  sustainability: SustainabilitySignal;
}

/** A fully scored company as shown in the table and exported to CSV. */
export interface ScoredCompany extends CompanyRecord {
  score: ScoreBreakdown;
  confidence: ConfidenceLevel;
  needsReview: boolean;
  needsReviewReasons: string[];
}

export type DatasetMode = "live" | "cached";

export interface Dataset {
  generatedAt: string;
  mode: DatasetMode;
  notes: string;
  companies: ScoredCompany[];
  /** Whether the client should run a live pull on first load (cache missing or stale). */
  shouldAutoRefresh: boolean;
  /** Whether an AI discovery key is configured server-side. */
  aiConfigured: boolean;
}
