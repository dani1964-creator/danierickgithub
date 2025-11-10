import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { BrokerResolver } from '@/lib/brokerResolver';

// Endpoint temporário de diagnóstico para inspecionar o broker resolvido pelo host.
// Não expõe segredos, apenas dados públicos do broker (logo_url, background_image_url, etc).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Preferir header x-forwarded-host (proxy) e depois host
    const hostHeader = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
    const host = hostHeader.split(':')[0].toLowerCase();

    // Forçar limpeza de cache do BrokerResolver neste endpoint diagnóstico
    try {
      BrokerResolver.clearCache();
    } catch (e) {
      // ignore
    }

    // Se o query param ?force_local=1 for passado, forçamos resolução local
    const forceLocal = req.query?.force_local === '1' || req.query?.force_local === 'true';

    let brokerId: string | null = null;
    let resolution_method = 'auto';

    try {
      if (forceLocal) {
        brokerId = await BrokerResolver.resolveBrokerLocally(host || '');
        resolution_method = 'local';
      } else {
        brokerId = await BrokerResolver.resolveBrokerByHost(host || undefined);
        resolution_method = 'auto';
      }
    } catch (e) {
      // Se falhar em modo auto e não for forceLocal, tentar fallback local
      if (!forceLocal) {
        try {
          brokerId = await BrokerResolver.resolveBrokerLocally(host || '');
          resolution_method = 'local-fallback';
        } catch (e2) {
          // leave brokerId null
        }
      }
    }
    if (!brokerId) {
      return res.status(404).json({ ok: false, error: 'Broker not found for host: ' + host });
    }

    const { data, error } = await supabase
      .from('brokers')
      .select(
        `id, business_name, display_name, website_slug, logo_url, primary_color, secondary_color, about_text, footer_text, whatsapp_button_color, whatsapp_button_text, background_image_url, overlay_color, overlay_opacity, hero_title, hero_subtitle, whatsapp_number, site_title, site_description, site_favicon_url, site_share_image_url, canonical_prefer_custom_domain, robots_index, robots_follow`
      )
      .eq('id', brokerId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ ok: false, error: error.message || error });
    }

    return res.status(200).json({ ok: true, broker: data || null, host, resolution_method });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
