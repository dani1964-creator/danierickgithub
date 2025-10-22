export function getHost(): string {
  if (typeof window === 'undefined') return '';
  return window.location.host.toLowerCase();
}

export function baseDomain(): string {
  return (import.meta.env.VITE_BASE_PUBLIC_DOMAIN || '').toLowerCase();
}

export function isCustomDomainHost(host?: string): boolean {
  const h = (host || getHost());
  const base = baseDomain();
  if (!h || !base) return false;
  if (h === base || h === `www.${base}` || h.endsWith(`.${base}`)) return false;
  return true;
}

/**
 * Resolve o website_slug do broker com base no host atual.
 * Regras:
 * - {slug}.{BASE_DOMAIN} retorna {slug} (ignora subdomínios reservados como 'app' e 'www')
 * - host customizado: consulta a tabela broker_domains para achar o broker e retorna o website_slug dele
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export async function resolveBrokerSlug(supabase: SupabaseClient): Promise<string | null> {
  const host = getHost();
  const base = baseDomain();
  if (!host || !base) return null;

  if (host.endsWith(`.${base}`)) {
    const sub = host.slice(0, -(base.length + 1));
    if (sub && sub !== 'app' && sub !== 'www') return sub;
  }

  // Domínio customizado
  const { data, error } = await supabase
    .from('broker_domains')
    .select('domain, broker_id, brokers!inner(website_slug)')
    .eq('domain', host)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('resolveBrokerSlug error', error);
    return null;
  }
  // Quando usa join com brokers!inner(...), o Supabase retorna um array de brokers
  const joined = (data as unknown as { brokers?: Array<{ website_slug?: string | null }> })
    ?.brokers;
  return joined && joined.length > 0 ? (joined[0].website_slug ?? null) : null;
}
