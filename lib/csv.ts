import type { ScoredCompany, Segment } from '@/lib/types'
import {
	companyDescription,
	contactField,
	contactJobTitle,
	parseContactName
} from '@/lib/csv-values'

/**
 * HubSpot contacts + companies import — same headers as HubSpot's sample file.
 * Extra columns after Company Domain Name are optional default properties.
 *
 * @see https://knowledge.hubspot.com/import-and-export/sample-import-files
 */

const HUBSPOT_INDUSTRY: Record<Segment, string> = {
	Coffee: 'Food & Beverages',
	'Food-to-go': 'Restaurants',
	QSR: 'Restaurants',
	Bakery: 'Food Production'
}

const COLUMNS: Array<{ header: string; value: (c: ScoredCompany) => string }> = [
	{ header: 'First Name', value: c => contactField(c, () => parseContactName(c.decisionMaker.name).first) },
	{ header: 'Last Name', value: c => contactField(c, () => parseContactName(c.decisionMaker.name).last) },
	{ header: 'Email Address', value: c => c.contact.email?.trim() ?? '' },
	{ header: 'Name', value: c => c.name },
	{ header: 'Company Domain Name', value: c => normalizeDomain(c.domain) },
	{ header: 'Job Title', value: c => contactField(c, () => contactJobTitle(c)) },
	{ header: 'Website URL', value: c => c.website },
	{ header: 'Industry', value: c => HUBSPOT_INDUSTRY[c.segment] },
	{ header: 'Country/Region', value: () => 'United Kingdom' },
	{ header: 'Type', value: () => 'Prospect' },
	{ header: 'Lifecycle Stage', value: () => 'Lead' },
	{ header: 'Description', value: c => companyDescription(c) }
]

function normalizeDomain(domain: string): string {
	return domain.trim().toLowerCase().replace(/^www\./, '').replace(/\/.*$/, '')
}

function escapeCell(value: string): string {
	if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
	return value
}

export function toHubSpotCsv(companies: ScoredCompany[]): string {
	const header = COLUMNS.map(col => escapeCell(col.header)).join(',')
	const rows = companies.map(company => COLUMNS.map(col => escapeCell(col.value(company))).join(','))
	return `\uFEFF${[header, ...rows].join('\r\n')}`
}

export const CSV_FILENAME = 'sustainium-shake-the-market-hubspot.csv'
