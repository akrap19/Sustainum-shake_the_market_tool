import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { Segment, SustainabilityLevel } from "@/lib/types";

/**
 * AI-assisted discovery via Google Gemini (Vercel AI SDK). The model proposes
 * real, currently-operating UK operators that match the fixed brief. These are
 * treated as *suggestions* (provenance: inferred) and are always grounded
 * afterwards by real sources (Companies House, Overpass, mailbox verifier).
 * An LLM is never used to assert a verified email or an exact location count.
 *
 * Key: GOOGLE_GENERATIVE_AI_API_KEY (free tier via Google AI Studio).
 */

export const GEMINI_MODEL = "gemini-3.6-flash";

const candidateSchema = z.object({
  companies: z
    .array(
      z.object({
        name: z.string().describe("Official company / brand name"),
        website: z.string().describe("Primary UK website, https://"),
        domain: z.string().describe("Bare domain, e.g. greggs.co.uk"),
        segment: z.enum(["Coffee", "Food-to-go", "QSR", "Bakery"]),
        estimatedUkLocations: z.number().describe("Approximate number of UK physical locations"),
        whyItFits: z.string().describe("One sentence on paper-lid relevance"),
        decisionMakerName: z
          .string()
          .nullable()
          .describe("Real first and last name of a person, or null — never a job title"),
        decisionMakerTitle: z.string().describe("Title, or a relevant buying role if the name is unknown"),
        buyingRole: z.string().describe("Packaging/procurement buying relevance"),
        sustainabilityLevel: z.enum(["strong", "moderate", "none", "unknown"]),
        sustainabilityNote: z.string(),
        sourceUrl: z.string().describe("A page on this company's own website (sustainability, about, or stores) — never a third-party URL"),
        suggestedEmails: z
          .array(z.string())
          .max(3)
          .optional()
          .default([])
          .describe("Named-person emails like first.last@mailbox-domain only; use the staff domain if it differs from the website; empty if unsure — never packaging@ or procurement@"),
        mailboxDomains: z
          .array(z.string())
          .max(3)
          .optional()
          .default([])
          .describe("Domains staff actually email from if different from the website, e.g. group.com"),
        companiesHouseNumber: z
          .string()
          .nullable()
          .optional()
          .describe("UK Companies House number if known (e.g. 12345678), else null — never invent one"),
      }),
    )
    .min(8)
    .max(15),
});

export type AiCandidate = z.infer<typeof candidateSchema>["companies"][number] & {
  segment: Segment;
  sustainabilityLevel: SustainabilityLevel;
};

const PROMPT = `You are a B2B market researcher for Sustainium, which sells PFAS-free
moulded-fibre paper lids (80/90 mm) for hot beverage cups.

Identify 8-15 REAL, currently-operating UK companies to prioritise (extra candidates
allow for some being filtered out; the tool keeps the top 10):
- Segment: multi-site QSR, coffee, or food-to-go operators.
- Must operate at least 20 physical UK locations.
- Must have physical food-service operations serving hot drinks in disposable cups.
- EXCLUDE Starbucks, Burger King, KFC and Costa Coffee (existing Sustainium relationships).
- Only include companies you are confident actually exist, with correct real websites.
- decisionMakerName: a real current first-and-last name (procurement, packaging, operations, or a UK director). Never a job title. Null only if you truly cannot name anyone.
- suggestedEmails: first.last@mailbox-domain for that person when you know the staff domain (it may differ from the public website). Empty if unsure. Never packaging@ or procurement@.
- mailboxDomains: staff email domains when they differ from the website.
- companiesHouseNumber: only if you know the real UK company number; otherwise null.
- Do not invent exact figures; estimatedUkLocations is an approximate.`;

export async function discoverCompanies(): Promise<AiCandidate[] | null> {
  if (!isConfigured()) return null;
  try {
    const { object } = await generateObject({
      model: google(GEMINI_MODEL),
      schema: candidateSchema,
      prompt: PROMPT,
    });
    return object.companies as AiCandidate[];
  } catch (error) {
    console.error("Gemini discovery failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export const aiSourceLabel = "AI discovery (Google Gemini) — verify before outreach";
