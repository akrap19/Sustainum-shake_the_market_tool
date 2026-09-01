'use client'

import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toHubSpotCsv, CSV_FILENAME } from '@/lib/csv'
import type { ScoredCompany } from '@/lib/types'

export function ExportCsvButton({ companies }: { companies: ScoredCompany[] }) {
	function handleExport() {
		if (companies.length === 0) {
			toast.error('No companies to export.')
			return
		}
		const csv = toHubSpotCsv(companies)
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = CSV_FILENAME
		link.click()
		URL.revokeObjectURL(url)
	}

	return (
		<Button onClick={handleExport} size='sm' className='cursor-pointer gap-2'>
			<Download />
			Download HubSpot ready CSV
		</Button>
	)
}
