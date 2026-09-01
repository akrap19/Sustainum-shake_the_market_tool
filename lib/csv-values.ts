import type { ScoredCompany } from '@/lib/types'
import { contactEvidenceSentence } from '@/lib/contact-evidence'
import { isPlaceholderDecisionMakerName } from '@/lib/decision-maker'

export function hasContactEmail(c: ScoredCompany): boolean {
	return Boolean(c.contact.email?.trim())
}

export function contactField(c: ScoredCompany, value: () => string): string {
	return hasContactEmail(c) ? value() : ''
}

export function parseContactName(name: string): { first: string; last: string } {
	if (isPlaceholderDecisionMakerName(name)) return { first: '', last: '' }

	const withoutParen = name.trim().replace(/\s*\([^)]*\)\s*/g, ' ').trim()
	const parts = withoutParen.split(/\s+/).filter(Boolean)
	if (parts.length === 0) return { first: '', last: '' }
	if (parts.length === 1) return { first: parts[0], last: '' }
	return { first: parts[0], last: parts.slice(1).join(' ') }
}

export function contactJobTitle(c: ScoredCompany): string {
	const title = c.decisionMaker.title.trim()
	if (title && !isPlaceholderDecisionMakerName(title)) return title
	return c.decisionMaker.buyingRole
}

export function companyDescription(c: ScoredCompany): string {
	const lines = [
		`Segment: ${c.segment}`,
		`Why it fits: ${c.fitReason}`,
		`UK locations: ~${c.locations.count}${c.locations.isEstimate ? ' (estimate)' : ''} — ${c.locations.method} [${c.locations.provenance}]`,
		`Priority: #${c.score.rank} (${c.score.total}/100) — ${c.score.explanation}`,
		`Confidence: ${c.confidence}`
	]

	if (c.needsReview) {
		lines.push(`Needs review: ${c.needsReviewReasons.join('; ')}`)
	}

	if (hasContactEmail(c)) {
		lines.push(`Contact: ${c.contact.email} (${c.contact.validationStatus}) — ${contactEvidenceSentence(c.contact)}`)
	} else {
		lines.push('Contact: no email captured yet — add manually after import.')
	}

	if (c.registration.source.url) {
		lines.push(`Companies House: ${c.registration.source.url}`)
	}

	lines.push(
		`Data provenance: registration:${c.registration.provenance} | locations:${c.locations.provenance} | decision-maker:${c.decisionMaker.provenance} | contact:${c.contact.provenance} | sustainability:${c.sustainability.provenance}`
	)
	return lines.join('\n')
}
