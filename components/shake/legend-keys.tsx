import type { ReactNode } from "react";
import { ProvenanceBadge, ValidationBadge } from "@/components/shake/badges";
import { Grid } from "@/components/layout/grid";

const SCORE_FACTORS = [
  { label: "Segment fit", points: 25 },
  { label: "UK location scale", points: 25 },
  { label: "Paper-lid need", points: 20 },
  { label: "Sustainability signal", points: 15 },
  { label: "Contact confidence", points: 15 },
] as const;

function KeyPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export function LegendKeys() {
  return (
    <div className="border-t border-border">
      <Grid lg={3} className="gap-px bg-border">
        <KeyPanel title="Data provenance">
          <div className="flex flex-wrap gap-1.5">
            <ProvenanceBadge provenance="live" />
            <ProvenanceBadge provenance="cached" />
            <ProvenanceBadge provenance="manually-reviewed" />
            <ProvenanceBadge provenance="inferred" />
            <ProvenanceBadge provenance="mocked" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Live = Companies House, OpenStreetMap, Hunter, or a fetched page — not Gemini.
            Cached = last live pull, reused until refetch or 24 hours.
            Reviewed = hand-checked from public filings or store locators.
            Inferred = Gemini suggestion or guessed email, not yet grounded.
            Mocked = placeholder, not from a real source.
          </p>
        </KeyPanel>
        <KeyPanel title="Email validation">
          <div className="flex flex-wrap gap-1.5">
            <ValidationBadge status="verified" />
            <ValidationBadge status="unverified" />
            <ValidationBadge status="unknown" />
            <ValidationBadge status="invalid" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Verified = mailbox confirmed. Unverified = we have an address, not confirmed.
            Unknown = no email found.
          </p>
        </KeyPanel>
        <KeyPanel title="Priority score (0–100)">
          <ul className="space-y-1.5">
            {SCORE_FACTORS.map((factor) => (
              <li key={factor.label} className="flex items-baseline justify-between gap-4 text-xs">
                <span className="text-muted-foreground">{factor.label}</span>
                <span className="tabular-nums font-medium text-foreground">{factor.points}</span>
              </li>
            ))}
          </ul>
        </KeyPanel>
      </Grid>
    </div>
  );
}
