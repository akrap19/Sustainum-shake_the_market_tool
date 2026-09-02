import { formatOfficerName, looksLikePersonName, personNameFrom } from '@/lib/contact-quality'
import { preferContact, preferDecisionMaker } from '@/lib/contact-merge'
import { findEmailCandidates } from '@/lib/email-candidates'
import { resolveContactFromCandidates } from '@/lib/pipeline-contact'
import type { EnrichTarget } from '@/lib/pipeline-targets'
import { suggestDecisionMaker } from '@/lib/sources/ai-person-email'
import { personSearchSource } from '@/lib/source-urls'
import type { CompaniesHouseOfficer } from '@/lib/sources/companies-house'
import type { CompanyRecord } from '@/lib/types'

function contactRank(status: CompanyRecord['contact']['validationStatus'], hasEmail: boolean): number {
	if (status === 'verified') return 4
	if (status === 'unverified') return 2
	if (status === 'unknown' && hasEmail) return 1
	return 0
}

function withOfficerName(base: CompanyRecord, officers: CompaniesHouseOfficer[]): CompanyRecord {
	if (looksLikePersonName(base.decisionMaker.name)) return base
	const officer = officers.find(o => looksLikePersonName(o.name))
	if (!officer) return base
	return {
		...base,
		decisionMaker: {
			...base.decisionMaker,
			name: formatOfficerName(officer.name),
			title: base.decisionMaker.title || officer.role,
			provenance: 'live',
			source: { label: 'Companies House officers', url: officer.appointmentsUrl }
		}
	}
}

/** Fill a missing person from CH / last run / Gemini, then search that person's email. */
export async function resolvePersonContact(
	target: EnrichTarget,
	base: CompanyRecord,
	officers: CompaniesHouseOfficer[],
	previous?: CompanyRecord
) {
	let named = withOfficerName(
		{ ...base, decisionMaker: preferDecisionMaker(previous?.decisionMaker, base.decisionMaker) },
		officers
	)
	let extras = { emails: [] as string[], domains: [] as string[] }

	if (!looksLikePersonName(named.decisionMaker.name)) {
		const found = await suggestDecisionMaker({
			company: target.name,
			domain: target.domain,
			website: base.website
		}).catch(() => ({
			name: '',
			title: '',
			emails: [] as string[],
			domains: [] as string[]
		}))
		extras = { emails: found.emails, domains: found.domains }
		const foundName = personNameFrom(found.name)
		if (foundName) {
			named = {
				...named,
				decisionMaker: {
					...named.decisionMaker,
					name: foundName,
					title: found.title || named.decisionMaker.title,
					provenance: 'inferred',
					source: personSearchSource(foundName, target.name)
				}
			}
		}
	}

	const firstList = await findEmailCandidates(target, named, officers, previous, extras)
	const first = await resolveContactFromCandidates(firstList, named, officers)
	if (first.contact.validationStatus === 'verified' || !looksLikePersonName(named.decisionMaker.name)) return first

	const hint = await suggestDecisionMaker({
		personName: named.decisionMaker.name,
		title: named.decisionMaker.title,
		company: target.name,
		domain: target.domain,
		website: base.website
	}).catch(() => ({ name: '', title: '', emails: [] as string[], domains: [] as string[] }))
	const secondList = await findEmailCandidates(target, named, officers, previous, hint)
	const tried = new Set(firstList.map(c => c.email))
	const fresh = secondList.filter(c => !tried.has(c.email))
	if (!fresh.length) return first
	const second = await resolveContactFromCandidates(fresh, named, officers)
	if (
		contactRank(second.contact.validationStatus, Boolean(second.contact.email)) <=
		contactRank(first.contact.validationStatus, Boolean(first.contact.email))
	) {
		return first
	}
	return {
		decisionMaker: preferDecisionMaker(first.decisionMaker, second.decisionMaker),
		contact: preferContact(first.contact, second.contact)
	}
}
