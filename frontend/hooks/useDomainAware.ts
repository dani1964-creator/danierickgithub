import { supabase } from '@/integrations/supabase/client';
import { getHost, baseDomain, isCustomDomainHost } from '@/lib/tenant';
import { logger } from '@/lib/logger';

// Versão simplificada: ignora domínio e usa apenas slug
export function useDomainAware() {
  const getCurrentDomain = () => getHost();
  const isCustomDomain = () => isCustomDomainHost();

  const getBrokerByDomainOrSlug = async (slug?: string) => {
    try {
      const host = getHost();
      const base = baseDomain();
      const domainParam = slug ? null : (isCustomDomainHost(host) ? host : null);
      const { data, error } = await supabase.rpc('get_broker_by_domain_or_slug', {
        domain_name: domainParam || undefined,
        slug_name: slug || undefined,
      });
      if (error) {
        logger.error('Error fetching broker:', error);
        return null;
      }
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        logger.error('Error in getBrokerByDomainOrSlug:', error);
      return null;
    }
  };

  const getPropertiesByDomainOrSlug = async (
    slug?: string,
    limit: number = 50,
    offset: number = 0
  ) => {
    try {
      const host = getHost();
      const domainParam = slug ? null : (isCustomDomainHost(host) ? host : null);
      const { data, error } = await supabase.rpc('get_properties_by_domain_or_slug', {
        domain_name: domainParam || undefined,
        slug_name: slug || undefined,
        property_limit: limit,
        property_offset: offset,
      });
      if (error) {
        logger.error('Error fetching properties:', error);
        return [];
      }
      return data || [];
    } catch (error) {
        logger.error('Error in getPropertiesByDomainOrSlug:', error);
      return [];
    }
  };

  const getBrokerContactInfo = async (slug?: string) => {
    try {
      const broker = await getBrokerByDomainOrSlug(slug);
      if (!broker) return null;
      const { data, error } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: broker.website_slug,
      });
      if (error) {
        logger.error('Error fetching broker contact:', error);
        return null;
      }
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      logger.error('Error in getBrokerContactInfo:', error);
      return null;
    }
  };

  return {
    getCurrentDomain,
    isCustomDomain,
    getBrokerByDomainOrSlug,
    getPropertiesByDomainOrSlug,
    getBrokerContactInfo,
  };
}