'use client'

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CompanyRow } from '@/components/shake/company-row'
import type { ScoredCompany } from '@/lib/types'

const COLUMNS = ['Priority', 'Company', 'Decision-maker', 'Contact', 'Trust'] as const

export function CompaniesTable({ companies }: { companies: ScoredCompany[] }) {
	if (companies.length === 0) {
		return (
			<p className='rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground'>
				No qualifying companies. Try Refetch, or check that at least 20 UK locations are found.
			</p>
		)
	}

	return (
		<div className='rounded-lg border border-border'>
			<Table className='table-fixed'>
				<colgroup>
					<col style={{ width: '6%' }} />
					<col style={{ width: '26%' }} />
					<col style={{ width: '20%' }} />
					<col style={{ width: '22%' }} />
					<col style={{ width: '26%' }} />
				</colgroup>
				<TableHeader>
					<TableRow className='hover:bg-transparent'>
						{COLUMNS.map(header => (
							<TableHead key={header} className='px-3 text-xs uppercase tracking-wide text-muted-foreground'>
								{header}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{companies.map(company => (
						<CompanyRow key={company.id} company={company} />
					))}
				</TableBody>
			</Table>
			<p className='border-t border-border px-3 py-2 text-xs text-muted-foreground'>
				Click any row for full sources, score breakdown and validation detail.
			</p>
		</div>
	)
}
