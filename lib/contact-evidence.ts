import type { Contact } from '@/lib/types'

function tidy(value: string): string {
	return value.trim().replace(/[.;]+$/g, '')
}

function includesIgnoreCase(haystack: string, needle: string): boolean {
	return Boolean(needle) && haystack.toLowerCase().includes(needle.toLowerCase())
}

function ensureSentence(value: string): string {
	const text = value.trim()
	if (!text) return ''
	return /[.!?]$/.test(text) ? text : `${text}.`
}

/** One sentence covering source + validation method (verified and unverified). */
export function contactEvidenceSentence(contact: Contact): string {
	const method = tidy(contact.validationMethod)
	const source = tidy(contact.source.label)
	if (!method && !source) return 'No contact source or validation method recorded.'
	if (!source) return ensureSentence(method)
	if (!method) return ensureSentence(source)

	const [originRaw, ...outcomeParts] = source.split('—')
	const origin = originRaw.trim()
	const outcome = outcomeParts.join('—').trim()
	const usefulOutcome = /mailbox verified with vrfymail/i.test(outcome) ? '' : outcome

	if (includesIgnoreCase(method, origin)) {
		if (usefulOutcome && !includesIgnoreCase(method, usefulOutcome)) {
			return ensureSentence(`${method} — ${usefulOutcome}`)
		}
		return ensureSentence(method)
	}

	if (usefulOutcome && !includesIgnoreCase(method, usefulOutcome)) {
		return ensureSentence(`${method}, sourced from ${origin} — ${usefulOutcome}`)
	}
	return ensureSentence(`${method}, sourced from ${origin}`)
}
