// @ts-expect-error - tipos remotos não resolvidos pelo linter local
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - tipos remotos não resolvidos pelo linter local
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

function xmlEscape(str: string) {
  return str.replace(/[<>&"']/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  }[c] as string));
}

serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const baseUrl = Deno.env.get('PUBLIC_BASE_URL') || `${url.protocol}//${url.host}`;

    if (!slug) {
      return new Response('Missing slug param', { status: 400, headers: corsHeaders });
    }

    // Buscar broker pelo slug
    const { data: brokerData, error: brokerError } = await supabase
      .rpc('get_broker_by_domain_or_slug', { domain_name: null, slug_name: slug });
    if (brokerError || !brokerData || brokerData.length === 0) {
      return new Response('Broker not found', { status: 404, headers: corsHeaders });
    }
    const broker = brokerData[0];

    // Listar imóveis ativos
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('slug, updated_at, is_active')
      .eq('is_active', true)
      .eq('broker_id', broker.id)
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (propsError) {
      console.error(propsError);
    }

    const preferCustom = broker.canonical_prefer_custom_domain ?? true;
    const siteBase = preferCustom && broker.custom_domain
      ? `https://${broker.custom_domain}`
      : `${baseUrl}/${broker.website_slug}`;

    const urls: string[] = [];
    // Home do corretor
    urls.push(`${siteBase}`);
    // Páginas institucionais
    urls.push(`${siteBase}/sobre-nos`);
    urls.push(`${siteBase}/politica-de-privacidade`);
    urls.push(`${siteBase}/termos-de-uso`);
    // Imóveis
    for (const p of properties || []) {
      urls.push(`${siteBase}/${p.slug}`);
    }

    const lastmod = new Date().toISOString();
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${xmlEscape(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`;

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
      }
    });
  } catch (e) {
    console.error(e);
    return new Response('Internal Error', { status: 500, headers: corsHeaders });
  }
});
