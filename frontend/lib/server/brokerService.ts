import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

type BrokerRow = any;

/**
 * Retorna apenas os campos públicos necessários para renderizar o site público.
 * Uso: SSR (getServerSideProps) e rota pública.
 */
export async function getPublicBrokerByHost({ hostname, brokerSlug, customDomain }: { hostname?: string; brokerSlug?: string; customDomain?: string }) {
  try {
    let broker: BrokerRow | null = null;

    if (brokerSlug) {
      const { data, error } = await supabase
        .from('brokers')
        .select(`id, website_slug, business_name, logo_url, site_favicon_url, site_share_image_url, primary_color, secondary_color, is_active, canonical_prefer_custom_domain, custom_domain, site_title, site_description, home_title_template, home_description_template, tracking_scripts`)
        .eq('website_slug', brokerSlug)
        .eq('is_active', true)
        .maybeSingle();
      if (!error && data) broker = data;
    } else if (customDomain && hostname) {
      const { data: domainData, error: domainErr } = await supabase
        .from('broker_domains')
        .select('broker_id')
        .eq('domain', hostname)
        .eq('is_active', true)
        .maybeSingle();

      if (!domainErr && domainData?.broker_id) {
        const { data: brokerData, error: brokerErr } = await supabase
          .from('brokers')
          .select(`id, website_slug, business_name, logo_url, site_favicon_url, site_share_image_url, primary_color, secondary_color, is_active, canonical_prefer_custom_domain, custom_domain, site_title, site_description, home_title_template, home_description_template, tracking_scripts`)
          .eq('id', domainData.broker_id)
          .eq('is_active', true)
          .maybeSingle();
        if (!brokerErr && brokerData) broker = brokerData;
      }
    }

    if (!broker) return null;

    // Sanitize / map para apenas os campos públicos (evita leak de campos sensíveis)
    const publicBroker = {
      id: broker.id,
      website_slug: broker.website_slug,
      business_name: broker.business_name,
      logo_url: broker.logo_url,
      site_favicon_url: broker.site_favicon_url,
      site_share_image_url: broker.site_share_image_url,
      primary_color: broker.primary_color,
      secondary_color: broker.secondary_color,
      is_active: broker.is_active,
      canonical_prefer_custom_domain: broker.canonical_prefer_custom_domain,
      custom_domain: broker.custom_domain,
      site_title: broker.site_title,
      site_description: broker.site_description,
      home_title_template: broker.home_title_template,
      home_description_template: broker.home_description_template,
      tracking_scripts: broker.tracking_scripts,
    };

    return publicBroker;
  } catch (error) {
    logger.error('getPublicBrokerByHost error:', error);
    return null;
  }
}

export default getPublicBrokerByHost;
