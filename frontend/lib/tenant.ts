import { logger } from '@/lib/logger';

export function getHost(): string {
  if (typeof window === 'undefined') return '';
  // Use hostname (without port) to make host-based resolution robust when running
  // on non-standard ports (dev proxy, preview URLs, etc.). window.location.host
  // can include the port which breaks .endsWith checks against the base domain.
  return (window.location.hostname || '').toLowerCase();
}

export function isDevelopmentHost(host?: string): boolean {
  const h = (host || getHost());
  if (!h) return false;

  // Hostnames de desenvolvimento comuns (baseadas em hostname, sem porta)
  return h === 'localhost' ||
         h === '127.0.0.1' ||
         h.includes('.app.github.dev') ||
         h.includes('.gitpod.io') ||
         h.includes('.codespaces.github.com') ||
         h.includes('.preview.app.github.dev');
}

export function baseDomain(): string {
  return (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').toLowerCase();
}

export function isCustomDomainHost(host?: string): boolean {
  const h = (host || getHost());
  const base = baseDomain();
  if (!h || !base) return false;
  if (h === base || h === `www.${base}` || h.endsWith(`.${base}`)) return false;
  return true;
}

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve o website_slug do broker com base no host atual.
 * Regras conforme especificação:
 * - {slug}.adminimobiliaria.site retorna {slug} (exceto "admin" que é reservado)
 * - domínio customizado: consulta broker_domains para encontrar broker_id e retorna website_slug
 */
export async function resolveBrokerSlug(supabase: SupabaseClient): Promise<string | null> {
  const host = getHost();
  const base = baseDomain();
  if (!host || !base) return null;

  // Verifica se é subdomínio do domínio base (*.adminimobiliaria.site)
  if (host.endsWith(`.${base}`)) {
    const subdomain = host.slice(0, -(base.length + 1));
    
    // "admin" é reservado - retorna null (404)
    if (subdomain === 'admin') {
      return null;
    }
    
    // Verificar se existe broker ativo com este website_slug
    const { data, error } = await supabase
      .from('brokers')
      .select('id, website_slug')
      .eq('website_slug', subdomain)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('resolveBrokerSlug subdomain error:', error);
      return null;
    }

    return data ? subdomain : null;
  }

  // Domínio customizado - consultar broker_domains
  const { data, error } = await supabase
    .from('broker_domains')
    .select(`
      domain, 
      broker_id, 
      brokers!inner(
        id,
        website_slug,
        is_active
      )
    `)
    .eq('domain', host)
    .eq('is_active', true)
    .eq('brokers.is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.warn('resolveBrokerSlug custom domain error:', error);
    return null;
  }

  const brokers = (data as any)?.brokers;
  return brokers && brokers.length > 0 ? brokers[0].website_slug : null;
}

/**
 * Resolve dados completos do broker baseado no host atual
 * Implementa getCurrentBrokerByRequest conforme especificação
 */
export async function getCurrentBrokerByRequest(supabase: SupabaseClient) {
  const host = getHost();
  const base = baseDomain();
  if (!host || !base) return null;

  try {
    // Subdomínio (*.adminimobiliaria.site)
    if (host.endsWith(`.${base}`)) {
      const subdomain = host.slice(0, -(base.length + 1));
      
      // "admin" é reservado
      if (subdomain === 'admin') {
        return null;
      }
      
      // Buscar por website_slug = subdomain
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('website_slug', subdomain)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('getCurrentBrokerByRequest subdomain error:', error);
        return null;
      }

      return data;
    }

    // Domínio customizado
    const { data: domainData, error: domainError } = await supabase
      .from('broker_domains')
      .select('broker_id')
      .eq('domain', host)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (domainError || !domainData) {
        logger.warn('getCurrentBrokerByRequest custom domain error:', domainError);
      return null;
    }

    // Buscar dados completos do broker
    const { data: brokerData, error: brokerError } = await supabase
      .from('brokers')
      .select('*')
      .eq('id', domainData.broker_id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (brokerError) {
      logger.warn('getCurrentBrokerByRequest broker fetch error:', brokerError);
      return null;
    }

    return brokerData;

  } catch (error) {
    logger.error('getCurrentBrokerByRequest general error:', error);
    return null;
  }
}
