import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para facilitar queries que consideram domínios personalizados
 */
export const useDomainAware = () => {
  const getCurrentDomain = useCallback(() => {
    const currentDomain = window.location.hostname;
    const isCustomDomain = !currentDomain.includes('lovable.app') && currentDomain !== 'localhost';
    return { currentDomain, isCustomDomain };
  }, []);

  const getBrokerByDomainOrSlug = useCallback(async (slug?: string) => {
    const { currentDomain, isCustomDomain } = getCurrentDomain();
    
    const { data, error } = await supabase
      .rpc('get_broker_by_domain_or_slug', { 
        domain_name: isCustomDomain ? currentDomain : null,
        slug_name: !isCustomDomain ? slug : null
      })
      .maybeSingle();

    return { data, error };
  }, [getCurrentDomain]);

  const getPropertiesByDomainOrSlug = useCallback(async (
    slug?: string, 
    limit: number = 50, 
    offset: number = 0
  ) => {
    const { currentDomain, isCustomDomain } = getCurrentDomain();
    
    const { data, error } = await supabase
      .rpc('get_properties_by_domain_or_slug', {
        domain_name: isCustomDomain ? currentDomain : null,
        slug_name: !isCustomDomain ? slug : null,
        property_limit: limit,
        property_offset: offset
      });

    return { data, error };
  }, [getCurrentDomain]);

  return {
    getCurrentDomain,
    getBrokerByDomainOrSlug,
    getPropertiesByDomainOrSlug
  };
};