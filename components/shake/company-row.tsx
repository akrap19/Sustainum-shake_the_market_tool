'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { ValidationBadge } from '@/components/shake/badges'
import { CompanyDetailSheet } from '@/components/shake/company-detail-sheet'
import { TrustCell } from '@/components/shake/trust-cell'
import { contactEvidenceSentence } from '@/lib/contact-evidence'
import { displayDecisionMakerName } from '@/lib/decision-maker'
import type { ScoredCompany } from '@/lib/types'

export function CompanyRow({ company }: { company: ScoredCompany }) {
	const [open, setOpen] = useState(false)

	return (
		<>
			<TableRow className='cursor-pointer align-top' onClick={() => setOpen(true)}>
				<TableCell className='py-3 text-center align-middle'>
					<div className='text-base font-semibold tabular-nums'>#{company.score.rank}</div>
					<div className='text-xs text-muted-foreground tabular-nums'>{company.score.total}/100</div>
				</TableCell>

				<TableCell className='py-3 whitespace-normal'>
					<div className='flex items-center gap-2'>
						<span className='font-medium'>{company.name}</span>
						<a
							href={company.website}
							target='_blank'
							rel='noopener noreferrer'
							onClick={event => event.stopPropagation()}
							className='shrink-0 text-muted-foreground hover:text-foreground'>
							<ExternalLink className='size-3.5' />
						</a>
					</div>
					<div className='text-xs text-muted-foreground'>
						{company.segment} · ~{company.locations.count.toLocaleString()} UK sites
					</div>
					<p className='mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground'>{company.fitReason}</p>
				</TableCell>

				<TableCell className='py-3 whitespace-normal'>
					<div className='font-medium'>{displayDecisionMakerName(company.decisionMaker)}</div>
					<div className='text-xs text-muted-foreground'>{company.decisionMaker.title}</div>
					{company.decisionMaker.buyingRole !== company.decisionMaker.title && (
						<div className='mt-0.5 line-clamp-2 text-xs text-muted-foreground'>{company.decisionMaker.buyingRole}</div>
					)}
				</TableCell>

				<TableCell className='py-3 whitespace-normal'>
					<div className='text-xs break-all'>{company.contact.email ?? 'No email located'}</div>
					<div className='mt-1'>
						<ValidationBadge status={company.contact.validationStatus} />
					</div>
					<p className='mt-1.5 text-xs leading-snug text-muted-foreground'>{contactEvidenceSentence(company.contact)}</p>
				</TableCell>

				<TableCell className='py-3 whitespace-normal align-top'>
					<TrustCell company={company} />
				</TableCell>
			</TableRow>

			<CompanyDetailSheet company={company} open={open} onOpenChange={setOpen} />
		</>
	)
}
