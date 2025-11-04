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

/**
 * Gera uma URL pública simples e síncrona para compartilhamento baseado em slug
 * (usado em operações de UI como "Compartilhar" e WhatsApp). Esta função
 * tenta usar a configuração do domínio base quando disponível, e faz um
 * fallback para window.location.origin quando não houver VITE/ENV disponível.
 */
export function getPublicUrl(brokerSlug: string, propertySlug: string, pathPrefix = '/'): string {
  try {
    const trim = (s: string) => s?.replace(/^\/+|\/+$/g, '') || '';
    const cleanProperty = trim(propertySlug || '');
    const cleanBroker = trim(brokerSlug || '');

    // Tentar usar variável de ambiente (Vite) quando presente
    // (em Next.js isso pode não existir, por isso fallback em seguida)
    // @ts-ignore
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BASE_PUBLIC_DOMAIN)
      ? String(import.meta.env.VITE_BASE_PUBLIC_DOMAIN)
      : '';

    if (base) {
      // Formato: https://{brokerSlug}.{base}/{propertySlug}
      return `https://${cleanBroker}.${base}/${cleanProperty}`.replace(/\/\/$/, '');
    }

    // Fallback para origin + /{brokerSlug}/{propertySlug}
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      return `${origin}/${cleanBroker}/${cleanProperty}`.replace(/\/\/$/, '');
    }

    // Último recurso
    return `https://${cleanBroker}/${cleanProperty}`;
  } catch (e) {
    return `/${brokerSlug}/${propertySlug}`;
  }
}
