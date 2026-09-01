/** Website domains are often not the staff mailbox domain (.com vs .co.uk, group vs brand). */
export function expandMailboxDomains(websiteDomain: string, extras: string[] = []): string[] {
  const seen = new Set<string>();
  const add = (raw?: string) => {
    const domain = (raw?.includes("@") ? raw.split("@")[1] : raw)?.trim().toLowerCase().replace(/^www\./, "");
    if (domain && /^[a-z0-9][a-z0-9.-]*\.[a-z.]{2,}$/.test(domain)) seen.add(domain);
  };
  add(websiteDomain);
  for (const extra of extras) add(extra);
  for (const domain of [...seen]) {
    if (domain.endsWith(".co.uk")) add(`${domain.slice(0, -6)}.com`);
    else if (domain.endsWith(".com")) add(`${domain.slice(0, -4)}.co.uk`);
  }
  return [...seen];
}
