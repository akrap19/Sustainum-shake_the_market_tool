import { formatOfficerName, looksLikePersonName } from "@/lib/contact-quality";

const HONORIFIC = /^(sir|dame|dr|lord|lady|cbe|obe|mbe|qc|kt)$/i;

export type EmailStyle = "full" | "first" | "initial" | "joined" | "underscore";

/** Most likely UK patterns first — first@ is common at independents. */
export const EMAIL_STYLES: EmailStyle[] = ["full", "first", "initial", "joined", "underscore"];

export function splitPersonName(fullName: string): { firstName: string; lastName: string } | null {
  if (!looksLikePersonName(fullName)) return null;
  const words = formatOfficerName(fullName)
    .split(/\s+/)
    .map((w) => w.replace(/[.,]/g, ""))
    .filter((w) => w && !HONORIFIC.test(w));
  if (words.length < 2) return null;
  return { firstName: words[0].toLowerCase(), lastName: words[words.length - 1].toLowerCase() };
}

export function emailsFromPersonName(fullName: string, domain: string, style: EmailStyle = "full"): string[] {
  const parts = splitPersonName(fullName);
  if (!parts) return [];
  const { firstName: first, lastName: last } = parts;
  const local = {
    full: `${first}.${last}`,
    first,
    initial: `${first[0]}.${last}`,
    joined: `${first}${last}`,
    underscore: `${first}_${last}`,
  }[style];
  return [`${local}@${domain}`];
}
