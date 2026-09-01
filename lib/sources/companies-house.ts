import { companiesHouseGet, isConfigured } from "@/lib/sources/companies-house-http";
import {
  normalizeCompanyNumber,
  pickBestMatch,
  profileUrl,
  searchQueries,
  titleMatchesBrand,
  type SearchHit,
} from "@/lib/sources/companies-house-match";

export { isConfigured };
export type { CompaniesHouseOfficer } from "@/lib/sources/companies-house-officers";
export { getActiveOfficers } from "@/lib/sources/companies-house-officers";

export interface CompaniesHouseMatch {
  companyNumber: string;
  companyName?: string;
  status?: string;
  sicCodes: string[];
  profileUrl: string;
}

export async function getCompany(companyNumber: string): Promise<CompaniesHouseMatch | null> {
  const data = (await companiesHouseGet(`/company/${encodeURIComponent(companyNumber)}`)) as {
    company_number?: string;
    company_name?: string;
    company_status?: string;
    sic_codes?: string[];
  } | null;
  if (!data?.company_number) return null;
  return {
    companyNumber: data.company_number,
    companyName: data.company_name,
    status: data.company_status,
    sicCodes: data.sic_codes ?? [],
    profileUrl: profileUrl(data.company_number),
  };
}

export async function searchCompany(name: string, companyNumberHint?: string): Promise<CompaniesHouseMatch | null> {
  const hint = normalizeCompanyNumber(companyNumberHint);
  if (hint) {
    const profile = await getCompany(hint);
    if (profile?.companyName && profile.status === "active" && titleMatchesBrand(profile.companyName, name)) {
      return profile;
    }
  }

  const pages = await Promise.all(
    searchQueries(name).map(async (query) => {
      const data = (await companiesHouseGet(`/search/companies?q=${encodeURIComponent(query)}`)) as { items?: SearchHit[] } | null;
      return { query, items: data?.items ?? [] };
    }),
  );
  const item = pickBestMatch(pages);
  if (!item?.company_number) return null;
  return (await getCompany(item.company_number)) ?? {
    companyNumber: item.company_number,
    status: item.company_status,
    sicCodes: [],
    profileUrl: profileUrl(item.company_number),
  };
}
