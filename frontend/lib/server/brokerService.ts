import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

type BrokerRow = any;

/**
 * Retorna apenas os campos públicos necessários para renderizar o site público.
 * Uso: SSR (getServerSideProps) e rota pública.
 * ATUALIZADO: usa get_public_broker_branding RPC para garantir consistência
 */
export async function getPublicBrokerByHost({ hostname, brokerSlug, customDomain }: { hostname?: string; brokerSlug?: string; customDomain?: string }) {
  try {
    let effectiveSlug = brokerSlug;

    // Se não tem slug mas tem custom domain, buscar slug primeiro
    if (!effectiveSlug && customDomain && hostname) {
      const { data: domainData, error: domainErr } = await supabase
        .from('broker_domains')
        .select('broker_id')
        .eq('domain', hostname)
        .eq('is_active', true)
        .maybeSingle();

      if (!domainErr && domainData?.broker_id) {
        const { data: brokerData, error: brokerErr } = await supabase
          .from('brokers')
          .select('website_slug')
          .eq('id', domainData.broker_id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (!brokerErr && brokerData?.website_slug) {
          effectiveSlug = brokerData.website_slug;
        }
      }
    }

    if (!effectiveSlug) {
      logger.warn('No broker slug resolved for:', { hostname, customDomain });
      return null;
    }

    // Usar RPC get_public_broker_branding que já existe no Supabase
    const { data, error } = await supabase
      .rpc('get_public_broker_branding', { 
        broker_website_slug: effectiveSlug 
      });

    if (error) {
      logger.error('Error calling get_public_broker_branding:', error);
      return null;
    }

    if (!data || data.length === 0) {
      logger.warn('No broker found via RPC for slug:', effectiveSlug);
      return null;
    }

    const broker = data[0];

    // Adicionar aliases para compatibilidade com ThemeProvider
    const publicBroker = {
      ...broker,
      brand_primary: broker.primary_color,
      brand_secondary: broker.secondary_color,
    };

    return publicBroker;
  } catch (error) {
    logger.error('getPublicBrokerByHost error:', error);
    return null;
  }
}

export default getPublicBrokerByHost;
