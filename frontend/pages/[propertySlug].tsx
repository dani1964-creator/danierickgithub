/**
 * Rota dinâmica para detalhes de imóveis no site público
 * URL: https://{slug}.adminimobiliaria.site/{property-slug}
 * 
 * Esta página captura URLs como:
 * - /apartamento-3-quartos-centro-651438be
 * - /casa-luxo-batel-a1b2c3d4
 * 
 * E renderiza a página de detalhes do imóvel.
 * 
 * IMPORTANTE: Implementa SSR para meta tags Open Graph serem visíveis para crawlers de redes sociais
 */

import { GetServerSideProps } from 'next';
import Head from 'next/head';
import PropertyDetailPage from '@/components/properties/PropertyDetailPage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

interface PropertyPageProps {
  initialQuery: {
    slug: string;
    propertySlug: string;
    customDomain: string;
  };
  seo?: {
    title: string;
    description: string;
    image: string;
    url: string;
    siteName: string;
  };
}

const PropertyPage = ({ initialQuery, seo }: PropertyPageProps) => {
  return (
    <>
      {seo && (
        <Head>
          {/* Open Graph para WhatsApp, Facebook, LinkedIn */}
          <meta property="og:title" content={seo.title} key="og:title" />
          <meta property="og:description" content={seo.description} key="og:description" />
          <meta property="og:image" content={seo.image} key="og:image" />
          <meta property="og:image:width" content="1200" key="og:image:width" />
          <meta property="og:image:height" content="630" key="og:image:height" />
          <meta property="og:image:type" content="image/jpeg" key="og:image:type" />
          <meta property="og:image:secure_url" content={seo.image} key="og:image:secure_url" />
          <meta property="og:type" content="website" key="og:type" />
          <meta property="og:site_name" content={seo.siteName} key="og:site_name" />
          <meta property="og:url" content={seo.url} key="og:url" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
          <meta name="twitter:title" content={seo.title} key="twitter:title" />
          <meta name="twitter:description" content={seo.description} key="twitter:description" />
          <meta name="twitter:image" content={seo.image} key="twitter:image" />
          
          {/* WhatsApp específico */}
          <meta property="whatsapp:image" content={seo.image} key="whatsapp:image" />
          
          <title>{seo.title}</title>
        </Head>
      )}
      <PropertyDetailPage initialQuery={initialQuery} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PropertyPageProps> = async (context) => {
  const brokerSlug = context.req.headers['x-broker-slug'] as string | undefined;
  const customDomain = context.req.headers['x-custom-domain'] as string | undefined;
  const propertySlug = context.params?.propertySlug as string;
  const host = context.req.headers.host || '';
  const protocol = context.req.headers['x-forwarded-proto'] || 'https';

  const initialQuery = {
    slug: brokerSlug || '',
    propertySlug: propertySlug || '',
    customDomain: customDomain || '',
  };

  // Buscar dados do imóvel e broker no servidor para meta tags Open Graph
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    // Buscar broker
    const { data: broker } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, custom_domain, site_share_image_url, header_brand_image_url, logo_url')
      .or(`website_slug.eq.${brokerSlug},custom_domain.eq.${customDomain}`)
      .single();

    if (!broker) {
      return { props: { initialQuery } };
    }

    // Buscar imóvel usando nova função RPC
    const { data: propertyData } = await (supabase as any)
      .rpc('get_property_by_slug', {
        p_property_slug: propertySlug,
        p_broker_slug: brokerSlug,
        p_custom_domain: customDomain
      })
      .single();

    // Extrair dados do imóvel da resposta RPC
    const property = (propertyData as any)?.property_data;

    if (!property) {
      return { props: { initialQuery } };
    }

    // Formatar preço
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(price);
    };

    // Montar URL do imóvel
    const baseUrl = customDomain 
      ? `${protocol}://${customDomain}`
      : `${protocol}://${host}`;
    
    // Para domínio customizado, a URL deve ser direta: https://imobideps.com/slug
    // Para subdomínio, a URL é: https://rfimobiliaria.adminimobiliaria.site/slug  
    const propertyUrl = `${baseUrl}/${property.slug}`;

    // Selecionar melhor imagem (prioridade: imóvel > broker)
    let imageUrl = property.main_image_url;
    if (!imageUrl || imageUrl === '') {
      imageUrl = broker.site_share_image_url || broker.header_brand_image_url || broker.logo_url || '';
    }
    
    // Garantir URL absoluta da imagem
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    
    // Fallback para placeholder se não houver imagem
    if (!imageUrl) {
      imageUrl = 'https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logos/placeholder-social-share.jpg';
    }

    // Montar SEO
    const seo = {
      title: `${property.title} - ${broker.business_name}`,
      description: `${formatPrice(property.price)} • ${property.bedrooms} quartos • ${property.bathrooms} banheiros • ${property.area_m2}m² em ${property.neighborhood}, ${property.city || property.uf}`,
      image: imageUrl,
      url: propertyUrl,
      siteName: broker.business_name,
    };

    return {
      props: {
        initialQuery,
        seo,
      },
    };
  } catch (error) {
    console.error('Error fetching property data for SEO:', error);
    return { props: { initialQuery } };
  }
};

export default PropertyPage;
