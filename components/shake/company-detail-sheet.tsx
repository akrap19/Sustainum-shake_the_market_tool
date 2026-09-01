'use client'

import { ExternalLink, TriangleAlert } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ConfidenceBadge, ProvenanceBadge, ValidationBadge } from '@/components/shake/badges'
import { contactEvidenceSentence } from '@/lib/contact-evidence'
import { displayDecisionMakerName } from '@/lib/decision-maker'
import type { ScoredCompany, SourceRef } from '@/lib/types'

function SourceLink({ source }: { source: SourceRef }) {
	if (!source.url) return <span className='text-muted-foreground'>{source.label}</span>
	return (
		<a
			href={source.url}
			target='_blank'
			rel='noopener noreferrer'
			className='inline-flex items-center gap-1 text-foreground underline underline-offset-4 hover:text-muted-foreground'>
			{source.label}
			<ExternalLink className='size-3' />
		</a>
	)
}

function Field({
	label,
	provenance,
	children
}: {
	label: string
	provenance: ScoredCompany['contact']['provenance']
	children: React.ReactNode
}) {
	return (
		<div className='space-y-1 border-b border-border pb-3'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{label}</p>
				<ProvenanceBadge provenance={provenance} />
			</div>
			<div className='text-sm'>{children}</div>
		</div>
	)
}

export function CompanyDetailSheet({
	company,
	open,
	onOpenChange
}: {
	company: ScoredCompany
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='w-full gap-0 overflow-y-auto sm:max-w-md'>
				<SheetHeader>
					<div className='flex items-center gap-2'>
						<SheetTitle>
							#{company.score.rank} · {company.name}
						</SheetTitle>
						<ConfidenceBadge level={company.confidence} />
					</div>
					<SheetDescription>{company.score.explanation}</SheetDescription>
				</SheetHeader>

				<div className='space-y-3 px-4 pb-6'>
					{company.needsReview && (
						<div className='flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400'>
							<TriangleAlert className='size-4 shrink-0' />
							<ul className='space-y-1'>
								{company.needsReviewReasons.map(reason => (
									<li key={reason}>{reason}</li>
								))}
							</ul>
						</div>
					)}

					<div className='space-y-1 border-b border-border pb-3'>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
							Priority score · {company.score.total}/100
						</p>
						<ul className='space-y-1 text-sm'>
							{company.score.factors.map(factor => (
								<li key={factor.key} className='flex items-baseline justify-between gap-3'>
									<span className='text-muted-foreground'>{factor.label}</span>
									<span className='shrink-0 font-medium'>
										{factor.score}/{factor.max}
									</span>
								</li>
							))}
						</ul>
					</div>

					<Field label='Why it fits the brief' provenance='manually-reviewed'>
						{company.fitReason}
					</Field>

					<Field
						label={`UK locations · ~${company.locations.count.toLocaleString()}`}
						provenance={company.locations.provenance}>
						<p className='text-muted-foreground'>{company.locations.method}</p>
						<SourceLink source={company.locations.source} />
					</Field>

					<Field label='Registration' provenance={company.registration.provenance}>
						<p className='text-muted-foreground'>
							{company.registration.companyNumber ? `No. ${company.registration.companyNumber} · ` : ''}
							SIC {company.registration.sicCodes.join(', ')}
						</p>
						<SourceLink source={company.registration.source} />
					</Field>

					<Field label='Decision-maker' provenance={company.decisionMaker.provenance}>
						<p className='font-medium text-foreground'>{displayDecisionMakerName(company.decisionMaker)}</p>
						<p className='text-muted-foreground'>{company.decisionMaker.title}</p>
						{company.decisionMaker.buyingRole !== company.decisionMaker.title && (
							<p className='text-muted-foreground'>{company.decisionMaker.buyingRole}</p>
						)}
						<SourceLink source={company.decisionMaker.source} />
					</Field>

					<Field label='Contact' provenance={company.contact.provenance}>
						<div className='flex items-center gap-2'>
							<span className='font-medium text-foreground'>{company.contact.email ?? 'No email located'}</span>
							<ValidationBadge status={company.contact.validationStatus} />
						</div>
						{company.contact.phone && <p className='text-muted-foreground'>{company.contact.phone}</p>}
						<p className='text-muted-foreground'>{contactEvidenceSentence(company.contact)}</p>
						{company.contact.source.url && <SourceLink source={company.contact.source} />}
					</Field>

					<Field label='Sustainability signal' provenance={company.sustainability.provenance}>
						<p className='text-muted-foreground'>{company.sustainability.note}</p>
						{company.sustainability.source && <SourceLink source={company.sustainability.source} />}
					</Field>
				</div>
			</SheetContent>
		</Sheet>
	)
}
