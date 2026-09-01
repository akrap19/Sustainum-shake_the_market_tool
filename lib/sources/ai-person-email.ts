/**
 * Gemini lookup for a named buyer and their likely mailbox domain.
 * Inferred only — mailbox status still comes from vrfymail.
 */

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { GEMINI_MODEL, isConfigured } from "@/lib/sources/ai-discovery";

const schema = z.object({
  personName: z
    .string()
    .nullable()
    .describe("Real first and last name of a current UK director or buyer, or null — never a job title"),
  title: z.string().describe("Their role, e.g. Managing Director"),
  mailboxDomains: z.array(z.string()).max(4).describe("Staff email domains, e.g. joeandthejuice.com"),
  emails: z.array(z.string()).max(6).describe("Likely personal work emails for this person — never packaging@"),
});

export async function suggestDecisionMaker(input: {
  personName?: string;
  title?: string;
  company: string;
  domain: string;
  website: string;
}): Promise<{ name: string; title: string; emails: string[]; domains: string[] }> {
  const empty = { name: "", title: input.title ?? "", emails: [] as string[], domains: [] as string[] };
  if (!isConfigured()) return empty;
  try {
    const known = input.personName ? `Person to find email for: ${input.personName}${input.title ? `, ${input.title}` : ""}.` : "No person is named yet — identify one real current UK director, MD, or procurement/packaging lead.";
    const { object } = await generateObject({
      model: google(GEMINI_MODEL),
      schema,
      prompt: `UK company research for Sustainium (paper cup lids).
Company: ${input.company}
Website: ${input.website} (public domain ${input.domain})
${known}

Return a real first-and-last name (null if you cannot), their title, staff mailbox domains (often different from the website), and personal emails (first.last / first / f.last). Never job titles as names. Never packaging@ or procurement@.`,
    });
    return {
      name: object.personName?.trim() ?? "",
      title: object.title,
      emails: object.emails,
      domains: object.mailboxDomains,
    };
  } catch {
    return empty;
  }
}
