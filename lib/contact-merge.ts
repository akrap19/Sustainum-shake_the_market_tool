import { isRoleBasedEmail, looksLikePersonName } from "@/lib/contact-quality";
import type { EmailCandidate } from "@/lib/email-candidates";
import type { CompanyRecord, Contact, DecisionMaker } from "@/lib/types";

export function findPrevious(
  records: CompanyRecord[],
  target: { id: string; name: string; domain: string },
): CompanyRecord | undefined {
  const domain = target.domain.toLowerCase();
  const name = target.name.toLowerCase();
  const compact = name.replace(/[^a-z0-9]+/g, "");
  return (
    records.find((r) => r.domain.toLowerCase() === domain) ??
    records.find((r) => r.id === target.id) ??
    records.find((r) => r.name.toLowerCase() === name) ??
    records.find((r) => r.name.toLowerCase().replace(/[^a-z0-9]+/g, "") === compact)
  );
}

/** Re-check only a mailbox that already passed SMTP — not the guessed backlog. */
export function candidatesFromPrevious(previous: CompanyRecord | undefined): EmailCandidate[] {
  if (!previous || previous.contact.validationStatus !== "verified") return [];
  const email = previous.contact.email?.trim().toLowerCase();
  if (!email || isRoleBasedEmail(email)) return [];
  const name = previous.decisionMaker.name.trim();
  const [firstName, lastName] = looksLikePersonName(name) ? name.split(/\s+/).filter(Boolean) : [];
  return [
    {
      email,
      sourceLabel: previous.contact.source.label,
      sourceUrl: previous.contact.source.url,
      firstName,
      lastName,
      position: previous.decisionMaker.title,
      kind: "personal",
    },
  ];
}

export function unionEmails(...groups: Array<string | undefined | string[]>): string[] {
  const seen = new Set<string>();
  for (const group of groups) {
    for (const email of Array.isArray(group) ? group : [group]) {
      const value = email?.trim().toLowerCase();
      if (value?.includes("@") && !isRoleBasedEmail(value)) seen.add(value);
    }
  }
  return [...seen].slice(0, 8);
}

function isVerified(contact: Contact | undefined): contact is Contact & { email: string } {
  return Boolean(contact?.email && contact.validationStatus === "verified");
}

export function preferContact(previous: Contact | undefined, next: Contact): Contact {
  const knownEmails = unionEmails(previous?.email, next.email);
  if (next.validationStatus === "verified") return { ...next, knownEmails };

  const sameAddress = previous?.email && next.email && previous.email.toLowerCase() === next.email.toLowerCase();
  if (isVerified(previous) && !(sameAddress && next.validationStatus === "invalid")) {
    return { ...previous, knownEmails: unionEmails(previous.email, knownEmails) };
  }

  const nextUseful = next.email && !isRoleBasedEmail(next.email);
  const prevPersonal = previous?.email && !isRoleBasedEmail(previous.email);
  if (!nextUseful && prevPersonal) return { ...previous, knownEmails: unionEmails(previous.email, knownEmails) };

  return { ...next, knownEmails };
}

export function preferDecisionMaker(previous: DecisionMaker | undefined, next: DecisionMaker): DecisionMaker {
  const nextLive = next.provenance === "live" && looksLikePersonName(next.name);
  const prevLive = previous?.provenance === "live" && looksLikePersonName(previous.name);
  if (nextLive) return next;
  if (prevLive) return previous;
  if (looksLikePersonName(next.name)) return next;
  if (previous && looksLikePersonName(previous.name)) return previous;
  return next;
}

/** Unknown is only for a missing address. A found email that did not SMTP-confirm is Unverified. */
export function normalizeContact(contact: Contact): Contact {
  const email = contact.email?.trim();
  if (email && contact.validationStatus === "unknown") {
    return { ...contact, email, validationStatus: "unverified" };
  }
  if (!email) return { ...contact, email: undefined, validationStatus: "unknown" };
  return contact;
}
