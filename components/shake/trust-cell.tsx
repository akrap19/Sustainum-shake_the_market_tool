import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConfidenceBadge, ProvenanceBadge } from '@/components/shake/badges'
import type { ScoredCompany } from '@/lib/types'

function TrustItem({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className='flex min-w-0 flex-col gap-0.5'>
			<span className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>{label}</span>
			<div className='flex items-start'>{children}</div>
		</div>
	)
}

export function TrustCell({ company }: { company: ScoredCompany }) {
	return (
		<div className='grid w-full grid-cols-2 gap-x-3 gap-y-2'>
			<TrustItem label='Confidence'>
				<ConfidenceBadge level={company.confidence} compact className='text-[11px]' />
			</TrustItem>
			<TrustItem label='Sites'>
				<ProvenanceBadge provenance={company.locations.provenance} className='text-[11px]' />
			</TrustItem>
			<TrustItem label='Review'>
				{company.needsReview ? (
					<Badge
						variant='outline'
						className='gap-0.5 border-amber-500/40 px-1.5 text-[11px] font-normal text-amber-700 dark:text-amber-400'>
						<TriangleAlert className='size-2.5 shrink-0' aria-hidden />
						Review
					</Badge>
				) : (
					<Badge
						variant='outline'
						className='border-emerald-500/40 px-1.5 text-[11px] font-normal text-emerald-700 dark:text-emerald-400'>
						Clear
					</Badge>
				)}
			</TrustItem>
			<TrustItem label='Contact'>
				<ProvenanceBadge provenance={company.contact.provenance} className='text-[11px]' />
			</TrustItem>
		</div>
	)
}
