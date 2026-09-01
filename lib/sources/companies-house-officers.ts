import { companiesHouseGet } from "@/lib/sources/companies-house-http";
import { profileUrl } from "@/lib/sources/companies-house-match";

export interface CompaniesHouseOfficer {
  name: string;
  role: string;
  appointmentsUrl: string;
}

function rankOfficer(role: string): number {
  if (/chief-executive|managing-director/.test(role)) return 4;
  if (role === "director") return 3;
  if (role.includes("director")) return 2;
  if (role.includes("secretary")) return 0;
  return 1;
}

export async function getActiveOfficers(companyNumber: string): Promise<CompaniesHouseOfficer[]> {
  const data = (await companiesHouseGet(`/company/${companyNumber}/officers?items_per_page=20`)) as {
    items?: Array<{ name: string; officer_role: string; resigned_on?: string; links?: { officer?: { appointments?: string } } }>;
  } | null;
  const page = `${profileUrl(companyNumber)}/officers`;
  return (data?.items ?? [])
    .filter((o) => !o.resigned_on)
    .sort((a, b) => rankOfficer(b.officer_role) - rankOfficer(a.officer_role))
    .map((o) => ({
      name: o.name,
      role: o.officer_role,
      appointmentsUrl: o.links?.officer?.appointments
        ? `https://find-and-update.company-information.service.gov.uk${o.links.officer.appointments}`
        : page,
    }));
}
