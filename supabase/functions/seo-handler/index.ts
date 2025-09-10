import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

function isSocialCrawler(userAgent: string): boolean {
  const crawlers = [
    'facebookexternalhit',
    'Twitterbot',
    'WhatsApp',
    'LinkedInBot',
    'TelegramBot',
    'SkypeUriPreview',
    'Discordbot',
    'Slackbot',
    'facebot',
    'ia_archiver'
  ];
  
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

function extractSlugFromPath(pathname: string): { brokerSlug: string | null, propertySlug: string | null } {
  // Remove leading slash and split
  const parts = pathname.substring(1).split('/');
  
  // Skip common paths that are not broker slugs
  const skipPaths = ['dashboard', 'auth', 'api', 'static', 'assets', '_next', 'public'];
  
  if (parts.length === 0 || skipPaths.includes(parts[0]) || parts[0] === '') {
    return { brokerSlug: null, propertySlug: null };
  }
  
  const brokerSlug = parts[0];
  const propertySlug = parts.length > 1 ? parts[1] : null;
  
  return { brokerSlug, propertySlug };
}

async function getBrokerData(slug: string) {
  console.log(`Fetching broker data for slug: ${slug}`);
  
  const { data, error } = await supabase
    .rpc('get_broker_by_domain_or_slug', {
      domain_name: null,
      slug_name: slug
    });
  
  if (error) {
    console.error('Error fetching broker:', error);
    return null;
  }
  
  return data?.[0] || null;
}

async function getPropertyData(brokerSlug: string, propertySlug: string) {
  console.log(`Fetching property data for broker: ${brokerSlug}, property: ${propertySlug}`);
  
  const { data, error } = await supabase
    .rpc('get_public_property_detail_with_realtor', {
      broker_slug: brokerSlug,
      property_slug: propertySlug
    });
  
  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }
  
  return data?.[0] || null;
}

function generateMetaTags(broker: any, property?: any) {
  let title, description, image, url, favicon;
  
  if (property) {
    // Meta tags para página de imóvel específico
    title = `${property.title} - ${broker.business_name}`;
    description = `${property.description?.substring(0, 160) || 'Imóvel exclusivo'} | ${broker.business_name}`;
    image = property.main_image_url || broker.site_share_image_url;
    url = `https://${broker.custom_domain || `${broker.website_slug}.lovable.app`}/${property.slug}`;
  } else {
    // Meta tags para página principal da imobiliária
    title = broker.site_title || `${broker.business_name} - Imóveis para Venda e Locação`;
    description = broker.site_description || `Encontre seu imóvel dos sonhos com ${broker.business_name}. Casas, apartamentos e propriedades exclusivas.`;
    image = broker.site_share_image_url;
    url = `https://${broker.custom_domain || `${broker.website_slug}.lovable.app`}`;
  }
  
  // Use broker favicon if available
  favicon = broker.site_favicon_url || '/favicon-placeholder.svg';
  
  // Fallback image se nenhuma estiver definida
  if (!image) {
    image = 'https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logos/placeholder-social-share.jpg';
  }
  
  return {
    title,
    description,
    image,
    url,
    favicon,
    siteName: broker.business_name
  };
}

function generateHTML(metaTags: any): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Meta Tags -->
    <title>${metaTags.title}</title>
    <meta name="description" content="${metaTags.description}" />
    
    <!-- Favicon -->
    <link rel="icon" href="${metaTags.favicon}" type="image/svg+xml" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${metaTags.url}" />
    <meta property="og:title" content="${metaTags.title}" />
    <meta property="og:description" content="${metaTags.description}" />
    <meta property="og:image" content="${metaTags.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${metaTags.siteName}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${metaTags.url}" />
    <meta name="twitter:title" content="${metaTags.title}" />
    <meta name="twitter:description" content="${metaTags.description}" />
    <meta name="twitter:image" content="${metaTags.image}" />
    
    <!-- WhatsApp optimization -->
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:locale" content="pt_BR" />
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1>${metaTags.title}</h1>
        <p>${metaTags.description}</p>
        <p>Carregando...</p>
        <script>
            // Redirecionar para o app React após um pequeno delay
            setTimeout(() => {
                window.location.href = "${metaTags.url}";
            }, 1000);
        </script>
    </div>
</body>
</html>`;
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const userAgent = req.headers.get('user-agent') || '';
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Check for query parameters (new sharing format)
    const brokerParam = url.searchParams.get('broker');
    const pathParam = url.searchParams.get('path');
    
    console.log(`Request: ${pathname}, User-Agent: ${userAgent}, Params: broker=${brokerParam}, path=${pathParam}`);
    
    // Get origin parameter for redirection
    const origin = url.searchParams.get('origin');
    
    // Verificar se é um crawler social
    if (!isSocialCrawler(userAgent)) {
      console.log('Not a social crawler, checking for redirect');
      
      // If we have origin parameter, redirect there
      if (origin) {
        console.log('Redirecting to origin:', origin);
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': origin
          }
        });
      }
      
      // Default: construct public URL and redirect
      if (brokerParam) {
        const publicUrl = pathParam && pathParam !== '/' 
          ? `https://lovable.dev/${brokerParam}${pathParam}`
          : `https://lovable.dev/${brokerParam}`;
        
        console.log('Redirecting to public URL:', publicUrl);
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': publicUrl
          }
        });
      }
      
      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }
    
    console.log('Social crawler detected!');
    
    let brokerSlug: string | null = null;
    let propertySlug: string | null = null;
    let targetUrl: string;
    
    if (brokerParam && pathParam) {
      // New format: using query parameters
      brokerSlug = brokerParam;
      if (pathParam !== '/') {
        const pathParts = pathParam.substring(1).split('/');
        if (pathParts.length > 0 && pathParts[0] !== '') {
          propertySlug = pathParts[0];
        }
      }
      targetUrl = `https://${brokerParam}.lovable.app${pathParam}`;
    } else {
      // Old format: extract from pathname
      const extracted = extractSlugFromPath(pathname);
      brokerSlug = extracted.brokerSlug;
      propertySlug = extracted.propertySlug;
      targetUrl = `https://${brokerSlug}.lovable.app${pathname}`;
    }
    
    if (!brokerSlug) {
      console.log('No broker slug found');
      return new Response(null, {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Buscar dados do broker
    const broker = await getBrokerData(brokerSlug);
    
    if (!broker) {
      console.log(`Broker not found for slug: ${brokerSlug}`);
      return new Response(null, {
        status: 404,
        headers: corsHeaders
      });
    }
    
    console.log(`Broker found: ${broker.business_name}`);
    
    let property = null;
    
    // Se há slug de propriedade, buscar dados da propriedade
    if (propertySlug) {
      property = await getPropertyData(brokerSlug, propertySlug);
      console.log(`Property ${propertySlug}:`, property ? 'found' : 'not found');
    }
    
    // Gerar meta tags
    const metaTags = generateMetaTags(broker, property);
    // Override URL com o target correto
    metaTags.url = targetUrl;
    
    console.log('Generated meta tags:', metaTags);
    
    // Gerar HTML com meta tags
    const html = generateHTML(metaTags);
    
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300' // Cache por 5 minutos
      },
    });
    
  } catch (error) {
    console.error('Error in seo-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});