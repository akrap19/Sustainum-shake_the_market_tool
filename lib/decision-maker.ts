import { looksLikeJobTitle, titleCasePersonName } from "@/lib/contact-quality";
import type { DecisionMaker } from "@/lib/types";

/** Legacy placeholder text from seed data — never show or export as a person name. */
const PLACEHOLDER_NAME =
  /\(name to confirm\)|\(confirm name\)|confirm name|to confirm\)|packaging\s*\/\s*procurement/i;

export function isPlaceholderDecisionMakerName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (looksLikeJobTitle(trimmed)) return true;
  return PLACEHOLDER_NAME.test(trimmed);
}

/** Prefer a real person name; never promote a job title into the name slot. */
export function displayDecisionMakerName(dm: DecisionMaker): string {
  const name = dm.name.trim();
  if (name && !isPlaceholderDecisionMakerName(name)) return titleCasePersonName(name);
  return "Name not identified";
}

export function hunterPersonName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}
