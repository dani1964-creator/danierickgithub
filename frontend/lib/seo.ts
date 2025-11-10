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

    // Preferir variável de ambiente Next (exposta ao cliente) quando disponível
    const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN)
      ? String(process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN)
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

/**
 * Retorna uma origem segura para uso em SSR/CSR.
 * - Se `NEXT_PUBLIC_APP_URL` estiver definida, retorna essa URL (preferencialmente usada em produção/CI).
 * - Caso contrário, retorna `window.location.origin` no cliente.
 * - Em SSR sem variável, retorna string vazia.
 */
export function getSafeOrigin(): string {
  const env = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) ? String(process.env.NEXT_PUBLIC_APP_URL) : '';
  if (env) return env.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}
