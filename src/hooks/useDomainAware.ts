import { supabase } from '@/integrations/supabase/client';

export function useDomainAware() {
  const getCurrentDomain = () => {
    // Get current domain from window.location
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Skip localhost and Lovable staging domains for domain-based lookup
      // But still return the hostname for logging purposes
      if (hostname === 'localhost' || hostname.includes('lovable.app') || hostname.includes('sandbox.lovable.dev')) {
        return null; // This means we should use slug-based lookup
      }
      
      return hostname;
    }
    return null;
  };

  const isCustomDomain = () => {
    return getCurrentDomain() !== null;
  };

  const getBrokerByDomainOrSlug = async (slug?: string, forceIgnoreSlug: boolean = false) => {
    const currentDomain = getCurrentDomain();
    
    console.log('=== DEBUG useDomainAware ===');
    console.log('currentDomain:', currentDomain);
    console.log('slug parameter:', slug);
    console.log('forceIgnoreSlug:', forceIgnoreSlug);
    
    try {
      // SECURITY: For custom domains, NEVER use slug - only domain
      if (currentDomain && forceIgnoreSlug) {
        console.log('SECURITY MODE: Custom domain - ignoring slug, using secure function');
        
        const { data, error } = await supabase.rpc('get_broker_by_domain_secure', {
          p_domain: currentDomain
        });

        console.log('Secure RPC response data:', data);
        console.log('Secure RPC response error:', error);

        // If secure function fails or returns empty, gracefully fallback to domain-based public RPC
        if (error || !data || data.length === 0) {
          console.warn('Secure RPC failed or returned empty. Falling back to public domain lookup. Error:', error);
          const { data: fbData, error: fbError } = await supabase.rpc('get_broker_by_domain_or_slug', {
            domain_name: currentDomain,
            slug_name: null
          });
          console.log('Fallback RPC data:', fbData, 'Fallback RPC error:', fbError);
          if (fbError) {
            console.error('Fallback RPC also failed:', fbError);
            return null;
          }
          const fbResult = fbData && fbData.length > 0 ? fbData[0] : null;
          console.log('Final broker result after fallback:', fbResult);
          console.log('=== END DEBUG useDomainAware (FALLBACK) ===');
          return fbResult;
        }

        const result = data && data.length > 0 ? data[0] : null;
        console.log('Final secure broker result:', result);
        console.log('=== END DEBUG useDomainAware (SECURE) ===');
        
        return result;
      }
      
      // Normal flow for Lovable domains or when slug is allowed
      const { data, error } = await supabase.rpc('get_broker_by_domain_or_slug', {
        domain_name: currentDomain,
        slug_name: slug
      });

      console.log('RPC response data:', data);
      console.log('RPC response error:', error);

      if (error) {
        console.error('Error fetching broker:', error);
        return null;
      }

      const result = data && data.length > 0 ? data[0] : null;
      console.log('Final broker result:', result);
      console.log('=== END DEBUG useDomainAware ===');
      
      return result;
    } catch (error) {
      console.error('Error in getBrokerByDomainOrSlug:', error);
      return null;
    }
  };

  const getPropertiesByDomainOrSlug = async (
    slug?: string, 
    limit: number = 50, 
    offset: number = 0,
    forceIgnoreSlug: boolean = false
  ) => {
    const currentDomain = getCurrentDomain();
    
    try {
      // SECURITY: For custom domains, ignore slug completely
      const finalSlug = (currentDomain && forceIgnoreSlug) ? undefined : slug;
      
      const { data, error } = await supabase.rpc('get_properties_by_domain_or_slug', {
        domain_name: currentDomain,
        slug_name: finalSlug,
        property_limit: limit,
        property_offset: offset
      });

      if (error) {
        console.error('Error fetching properties:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPropertiesByDomainOrSlug:', error);
      return [];
    }
  };

  const getBrokerContactInfo = async (slug?: string, forceIgnoreSlug: boolean = false) => {
    const currentDomain = getCurrentDomain();
    
    try {
      // First get the broker to find their slug if we have a domain
      const broker = await getBrokerByDomainOrSlug(slug, forceIgnoreSlug);
      if (!broker) return null;

      // Use the existing public contact function with the broker's slug
      const { data, error } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: broker.website_slug
      });

      if (error) {
        console.error('Error fetching broker contact:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in getBrokerContactInfo:', error);
      return null;
    }
  };

  return {
    getCurrentDomain,
    isCustomDomain,
    getBrokerByDomainOrSlug,
    getPropertiesByDomainOrSlug,
    getBrokerContactInfo
  };
}