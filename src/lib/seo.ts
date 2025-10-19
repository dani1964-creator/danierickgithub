export type BrokerSEOBase = {
  custom_domain?: string | null;
  website_slug?: string | null;
  canonical_prefer_custom_domain?: boolean | null;
  business_name?: string | null;
};

export function getCanonicalBase(broker: BrokerSEOBase, origin: string) {
  const prefer = broker?.canonical_prefer_custom_domain ?? true;
  if (prefer && broker?.custom_domain) {
    return `https://${broker.custom_domain}`;
  }
  return `${origin}/${broker?.website_slug ?? ''}`.replace(/\/$/, '');
}

export function applyTemplate(template: string | null | undefined, values: Record<string, string | number>) {
  if (!template || !template.trim()) return null;
  let result = template;
  for (const k of Object.keys(values)) {
    const val = String(values[k] ?? '');
    const re = new RegExp(`\\{${k}\\}`, 'g');
    result = result.replace(re, val);
  }
  return result;
}
