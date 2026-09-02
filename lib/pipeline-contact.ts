import { formatOfficerName, looksLikePersonName, samePersonName } from '@/lib/contact-quality'
import { hunterPersonName } from '@/lib/decision-maker'
import type { EmailCandidate } from '@/lib/email-candidates'
import type { CompaniesHouseOfficer } from '@/lib/sources/companies-house'
import * as verifier from '@/lib/sources/email-verifier'
import type { CompanyRecord, Contact, DecisionMaker } from '@/lib/types'

const MAX_VERIFY_TRIES = 10

function rankStatus(status: Contact['validationStatus']): number {
	return { verified: 4, unverified: 2, unknown: 1, invalid: 0 }[status]
}

function liveOfficer(officer: CompaniesHouseOfficer, base: CompanyRecord): DecisionMaker {
	return {
		name: formatOfficerName(officer.name),
		title: base.decisionMaker.title || officer.role,
		buyingRole: base.decisionMaker.buyingRole,
		provenance: 'live',
		source: { label: 'Companies House officers', url: officer.appointmentsUrl }
	}
}

function resolveDecisionMaker(
	person: EmailCandidate | undefined,
	base: CompanyRecord,
	officers: CompaniesHouseOfficer[]
): DecisionMaker {
	const candidateName = hunterPersonName(person?.firstName, person?.lastName) || base.decisionMaker.name
	const matched = officers.find(
		o => samePersonName(candidateName, o.name) || samePersonName(base.decisionMaker.name, o.name)
	)
	if (matched) return liveOfficer(matched, base)

	const fromHunter = hunterPersonName(person?.firstName, person?.lastName)
	if (fromHunter && looksLikePersonName(fromHunter) && person?.sourceLabel.includes('Hunter.io')) {
		return {
			name: fromHunter,
			title: person.position ?? base.decisionMaker.title,
			buyingRole: base.decisionMaker.buyingRole,
			provenance: 'live',
			source: { label: person.sourceLabel, url: person.sourceUrl ?? base.decisionMaker.source.url }
		}
	}

	const officer = officers.find(o => looksLikePersonName(o.name))
	if (officer) return liveOfficer(officer, base)

	const name = looksLikePersonName(base.decisionMaker.name) ? base.decisionMaker.name.trim() : ''
	return { ...base.decisionMaker, name }
}

async function verifiedContact(person: EmailCandidate, tries: number): Promise<Contact> {
	const verification = await verifier.verifyEmail(person.email).catch(() => null)
	const status = verification ? verifier.verifyToStatus(verification.result) : 'unverified'
	return {
		email: person.email,
		validationStatus: status,
		validationMethod: verification
			? verifier.verificationMethodLabel(verification, tries)
			: `Derived from ${person.sourceLabel} — not yet verified`,
		confidenceScore: person.confidence,
		provenance: verification ? 'live' : 'inferred',
		source: { label: person.sourceLabel, url: person.sourceUrl }
	}
}

export async function resolveContactFromCandidates(
	candidates: EmailCandidate[],
	base: CompanyRecord,
	officers: CompaniesHouseOfficer[] = []
): Promise<{ decisionMaker: DecisionMaker; contact: Contact }> {
	const queue = candidates.filter(c => c.kind === 'personal')
	let fallback: { person: EmailCandidate; contact: Contact } | null = null
	let tries = 0
	for (const person of queue) {
		if (tries >= MAX_VERIFY_TRIES) break
		tries += 1
		const contact = await verifiedContact(person, tries)
		if (contact.validationStatus === 'verified') {
			return { decisionMaker: resolveDecisionMaker(person, base, officers), contact }
		}
		if (contact.validationStatus === 'invalid') continue
		if (!fallback || rankStatus(contact.validationStatus) > rankStatus(fallback.contact.validationStatus)) {
			fallback = { person, contact }
		}
	}

	const person = fallback?.person ?? queue[0]
	const decisionMaker = resolveDecisionMaker(person, base, officers)
	if (fallback) return { decisionMaker, contact: fallback.contact }
	if (!person) {
		return {
			decisionMaker,
			contact: {
				...base.contact,
				email: undefined,
				validationStatus: 'unknown',
				validationMethod: 'No named-person email candidates to check'
			}
		}
	}
	return {
		decisionMaker,
		contact: {
			email: person.email,
			validationStatus: 'unverified',
			validationMethod: `Derived ${person.email} from ${person.sourceLabel} — mailbox not confirmed after ${tries} checks`,
			provenance: 'inferred',
			source: { label: person.sourceLabel, url: person.sourceUrl }
		}
	}
}
