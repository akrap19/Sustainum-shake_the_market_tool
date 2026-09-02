/**
 * OpenStreetMap Overpass API client (free, no key required).
 * Counts UK physical locations for a brand as supporting evidence for the
 * "20+ UK locations" gate. OSM coverage is community-sourced, so counts are
 * treated as live evidence but flagged as approximate.
 */

/**
 * Globally-complete Overpass mirrors, tried in order. The primary instance is
 * frequently overloaded, so we fall back to other full-planet mirrors. Regional
 * mirrors (e.g. overpass.osm.ch) are intentionally excluded because they only
 * hold local data and would return 0 for UK brands.
 */
const ENDPOINTS = [
	'https://overpass-api.de/api/interpreter',
	'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter'
]

/** Per-request ceiling; mirrors are raced so one slow host does not block others. */
const QUERY_TIMEOUT_MS = 15_000

export interface OverpassCount {
	count: number
	query: string
}

function buildQuery(brand: string): string {
	// AI often appends " UK" to a brand (e.g. "McDonald's UK") but OSM tags the
	// bare brand ("McDonald's"), so drop a trailing country suffix. Match brand
	// and name case-insensitively (OSM has "LEON" where the AI says "Leon").
	const cleaned = brand.replace(/\s+UK$/i, '').trim()
	const safe = cleaned.replace(/[\\"]/g, '\\$&').replace(/[.*+?^${}()|[\]]/g, '\\$&')
	return `[out:json][timeout:15];
area["ISO3166-1"="GB"][admin_level=2]->.uk;
(
  nwr["brand"~"^${safe}$",i](area.uk);
  nwr["name"~"^${safe}$",i]["amenity"~"cafe|fast_food|restaurant"](area.uk);
);
out count;`
}

/** Overpass rejects anonymous / datacenter clients without an identifying UA. */
const USER_AGENT = 'SustainiumShakeTheMarket/1.0 (https://sustainum-shake-the-market-tool.vercel.app/; UK site counts)'

async function queryEndpoint(endpoint: string, query: string): Promise<OverpassCount> {
	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': USER_AGENT
		},
		body: `data=${encodeURIComponent(query)}`,
		cache: 'no-store',
		signal: AbortSignal.timeout(QUERY_TIMEOUT_MS)
	})
	if (!res.ok) throw new Error(`Overpass ${endpoint} returned ${res.status}`)

	const data = (await res.json()) as {
		elements?: Array<{ tags?: { total?: string; nodes?: string; ways?: string } }>
	}
	const tags = data.elements?.[0]?.tags
	if (!tags) throw new Error(`Overpass ${endpoint} returned no count`)

	const total = Number(tags.total ?? 0)
	return { count: Number.isFinite(total) ? total : 0, query }
}

export async function countUkLocations(brand: string): Promise<OverpassCount | null> {
	const query = buildQuery(brand)
	try {
		return await Promise.any(ENDPOINTS.map(endpoint => queryEndpoint(endpoint, query)))
	} catch {
		console.error('Overpass location count failed for', brand)
		return null
	}
}
