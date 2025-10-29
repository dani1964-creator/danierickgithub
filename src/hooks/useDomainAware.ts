import { supabase } from '@/integrations/supabase/client';
import { getHost, baseDomain, isCustomDomainHost } from '@/lib/tenant';
import { BrokerResolver } from '@/lib/brokerResolver';

export function useDomainAware() {
  const getCurrentDomain = () => getHost();
  const isCustomDomain = () => isCustomDomainHost();

  /**
   * Obtém broker baseado no host atual (subdomínio ou domínio customizado)
   * ou por slug explícito (para compatibilidade)
   * ATUALIZADO: usa o novo BrokerResolver conforme recomendações RLS
   */
  const getBrokerByDomainOrSlug = async (slug?: string) => {
    try {
      // Se slug explícito é fornecido, usar ele diretamente
      if (slug) {
        const { data, error } = await supabase
          .from('brokers')
          .select('*')
          .eq('website_slug', slug)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching broker by slug:', error);
          return null;
        }
        return data;
      }

      // Novo: usar BrokerResolver para obter broker_id
      const brokerId = await BrokerResolver.getCurrentBrokerId();
      if (!brokerId) return null;

      // Buscar dados completos do broker
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('id', brokerId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching broker by resolved ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBrokerByDomainOrSlug:', error);
      return null;
    }
  };

  /**
   * Lista propriedades para o broker atual (baseado no host ou slug)
   * ATUALIZADO: usa PublicQueryHelper conforme recomendações do Supabase Assistant IA
   */
  const getPropertiesByDomainOrSlug = async (
    slug?: string,
    limit: number = 50,
    offset: number = 0
  ) => {
    try {
      if (slug) {
        // Para slug explícito, resolver broker_id primeiro
        const { data: brokerData, error: brokerError } = await supabase
          .from('brokers')
          .select('id')
          .eq('website_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (brokerError || !brokerData) {
          console.error('Error fetching broker by slug:', brokerError);
          return [];
        }

        // Query direta com broker_id conhecido
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('broker_id', brokerData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('Error fetching properties by slug:', error);
          return [];
        }
        return data || [];
      } else {
        // Para host atual, usar PublicQueryHelper (implementa Edge Function + fallback)
        const result = await (await import('@/lib/publicQueries')).PublicQueryHelper.getPublicProperties({
          limit,
          offset,
          orderBy: 'created_at',
          ascending: false
        });

        if (result.error) {
          console.error('Error fetching properties by host:', result.error);
          return [];
        }
        return result.data || [];
      }
    } catch (error) {
      console.error('Error in getPropertiesByDomainOrSlug:', error);
      return [];
    }
  };

  /**
   * Obtém informações de contato público do broker
   * ATUALIZADO: usa PublicQueryHelper conforme recomendações do Supabase Assistant IA
   */
  const getBrokerContactInfo = async (slug?: string) => {
    try {
      if (slug) {
        // Para slug explícito, query direta
        const { data: broker, error } = await supabase
          .from('brokers')
          .select(`
            id, business_name, display_name, website_slug, logo_url,
            primary_color, secondary_color, about_text, footer_text,
            whatsapp_button_color, whatsapp_button_text, background_image_url,
            overlay_color, overlay_opacity, hero_title, hero_subtitle,
            whatsapp_number, site_title, site_description, site_favicon_url,
            site_share_image_url, canonical_prefer_custom_domain,
            robots_index, robots_follow
          `)
          .eq('website_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching broker by slug:', error);
          return null;
        }
        return broker;
      } else {
        // Para host atual, usar PublicQueryHelper (implementa Edge Function + fallback)
        const result = await (await import('@/lib/publicQueries')).PublicQueryHelper.getPublicBroker();

        if (result.error) {
          console.error('Error fetching broker by host:', result.error);
          return null;
        }
        return result.data;
      }
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
    getBrokerContactInfo,
  };
}