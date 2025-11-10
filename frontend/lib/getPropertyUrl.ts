export type GetPropertyUrlOpts = {
  isCustomDomain: boolean;
  brokerSlug?: string | null | undefined;
  propertySlug?: string | null | undefined;
  propertyId?: string | null | undefined;
};

export function getPropertyUrl(opts: GetPropertyUrlOpts) {
  const slug = opts.propertySlug || opts.propertyId || '';
  if (!slug) return '/';

  if (opts.isCustomDomain) {
    // For custom domains or shared-domain routes that require broker in path
    const brokerSegment = opts.brokerSlug ? `/${opts.brokerSlug}` : '';
    return `${brokerSegment}/${slug}`.replace(/\/+/g, '/');
  }

  // For tenant subdomains the broker is implicit in host, use top-level path
  return `/${slug}`;
}

export default getPropertyUrl;
