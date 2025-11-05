import { supabase } from '@/integrations/supabase/client';
import { getHost, baseDomain } from '@/lib/tenant';
import { BrokerResolver } from '@/lib/brokerResolver';

export type BrokerSEOBase = {
  custom_domain?: string | null;
  website_slug?: string | null;
  canonical_prefer_custom_domain?: boolean | null;
  business_name?: string | null;
  robots_index?: boolean | null;
  robots_follow?: boolean | null;
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
 * Gera a URL canônica para SEO baseado nas preferências do broker
 * ATUALIZADO: usa BrokerResolver e implementa canonical_prefer_custom_domain
 */
export async function generateCanonicalUrl(brokerSlug?: string, path: string = ''): Promise<string> {
  try {
    const host = getHost();
    const base = baseDomain();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    let brokerId: string | null = null;
    
    // Resolver broker_id
    if (brokerSlug) {
      // Por slug
      const { data: brokerData, error } = await supabase
        .from('brokers')
        .select('id')
        .eq('website_slug', brokerSlug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error || !brokerData) {
        return `https://${brokerSlug}.${base}/${cleanPath}`.replace(/\/$/, '');
      }
      brokerId = brokerData.id;
    } else {
      // Por host atual
      brokerId = await BrokerResolver.getCurrentBrokerId();
      if (!brokerId) {
        return `https://${host}/${cleanPath}`.replace(/\/$/, '');
      }
    }

    // Buscar configurações do broker incluindo domínios customizados
    const { data: broker, error } = await supabase
      .from('brokers')
      .select(`
        website_slug,
        canonical_prefer_custom_domain,
        broker_domains!inner(domain, is_active)
      `)
      .eq('id', brokerId)
      .eq('is_active', true)
      .eq('broker_domains.is_active', true)
      .maybeSingle();

    if (error || !broker) {
      // Fallback: buscar só dados básicos do broker
      const { data: basicBroker } = await supabase
        .from('brokers')
        .select('website_slug, canonical_prefer_custom_domain')
        .eq('id', brokerId)
        .eq('is_active', true)
        .maybeSingle();

      const slug = basicBroker?.website_slug || brokerSlug;
      return slug 
        ? `https://${slug}.${base}/${cleanPath}`.replace(/\/$/, '')
        : `https://${host}/${cleanPath}`.replace(/\/$/, '');
    }

    // ✅ Implementar canonical_prefer_custom_domain
    if (broker.canonical_prefer_custom_domain && broker.broker_domains?.length > 0) {
      // Preferir domínio customizado ativo
      const customDomain = broker.broker_domains[0].domain;
      return `https://${customDomain}/${cleanPath}`.replace(/\/$/, '');
    }

    // Usar subdomínio padrão
    const slug = broker.website_slug;
    return `https://${slug}.${base}/${cleanPath}`.replace(/\/$/, '');

  } catch (error) {
    console.warn('Error generating canonical URL:', error);
    const host = getHost();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `https://${host}/${cleanPath}`.replace(/\/$/, '');
  }
}

/**
 * Gera meta tags para robots baseado nas configurações do broker
 */
export function generateRobotsMeta(broker: any): { index: boolean; follow: boolean } {
  return {
    index: broker?.robots_index !== false, // default true
    follow: broker?.robots_follow !== false, // default true
  };
}

/**
 * Gera o conteúdo completo da meta tag robots
 */
export function generateRobotsContent(broker: any): string {
  const { index, follow } = generateRobotsMeta(broker);
  const indexValue = index ? 'index' : 'noindex';
  const followValue = follow ? 'follow' : 'nofollow';
  return `${indexValue}, ${followValue}`;
}
