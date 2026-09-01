/** Heuristics so we do not treat job titles or invented role inboxes as people. */

const ROLE_LOCAL =
  /^(packaging|procurement|sustainability|info|hello|contact|sales|enquiries|enquiry|admin|office|team|support)$/i;

const TITLE_HINT =
  /^(head of|director of|managing director|chief |ceo|cfo|coo|president|buyer|procurement|packaging)/i;

export function isRoleBasedEmail(email: string): boolean {
  return ROLE_LOCAL.test(email.split("@")[0]?.trim() ?? "");
}

export function looksLikePersonalEmail(email: string): boolean {
  if (isRoleBasedEmail(email) || !email.includes("@")) return false;
  const local = email.split("@")[0] ?? "";
  return /^[a-z][a-z0-9._-]{1,}$/i.test(local);
}

export function looksLikeJobTitle(value: string): boolean {
  const trimmed = value.trim();
  return Boolean(trimmed) && TITLE_HINT.test(trimmed) && !/[A-Z][a-z]+ [A-Z]/.test(trimmed);
}

export function looksLikePersonName(value: string): boolean {
  return Boolean(personNameFrom(value));
}

/** Keep "Jane Smith, CEO"; drop a bare job title. */
export function personNameFrom(value: string): string {
  const formatted = formatOfficerName(value.trim());
  const stripped = formatted.replace(/,?\s+(managing director|chief executive.*|ceo|cfo|coo|founder.*|president.*)$/i, "").trim();
  if (!stripped || looksLikeJobTitle(stripped)) return "";
  if (/\b(ltd|limited|plc|llp|inc|company)\b/i.test(stripped)) return "";
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return "";
  return stripped;
}

export function titleCasePersonName(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.split("-").map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : "")).join("-"))
    .join(" ");
}

/** Companies House stores "SURNAME, Forename". */
export function formatOfficerName(name: string): string {
  const [surname, forename] = name.split(",").map((part) => part.trim());
  return forename && surname ? `${forename} ${surname}` : name.trim();
}

function nameParts(value: string): string[] {
  return (personNameFrom(value) || formatOfficerName(value))
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/** True when last names match and first names match or share an initial. */
export function samePersonName(a: string, b: string): boolean {
  const left = nameParts(a);
  const right = nameParts(b);
  if (left.length < 2 || right.length < 2) return false;
  const lastOk = left[left.length - 1] === right[right.length - 1];
  const firstOk = left[0] === right[0] || left[0][0] === right[0][0];
  return lastOk && firstOk;
}
