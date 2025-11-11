import type { BrokerProfile, BrokerContact } from '@/shared/types/broker';
import type { Property } from '@/shared/types/tenant';
import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePropertyFilters } from '@/hooks/usePropertyFilters';
import { PublicSiteSkeleton } from '@/components/ui/loading-skeleton';
import HeroBanner from '@/components/home/HeroBanner';
import SearchFilters from '@/components/home/SearchFilters';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import PropertiesGrid from '@/components/home/PropertiesGrid';
import ContactCTA from '@/components/home/ContactCTA';
import Footer from '@/components/home/Footer';
import WhatsAppFloat from '@/components/home/WhatsAppFloat';
import FixedHeader from '@/components/home/FixedHeader';
import TrackingScripts from '@/components/tracking/TrackingScripts';
import PropertyDetailPage from '@/components/properties/PropertyDetailPage';
import LeadModal from '@/components/leads/LeadModal';
import { EnhancedSecurity } from '@/lib/enhanced-security';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useDomainAware } from '@/hooks/useDomainAware';
import { SEODebugPanel } from '@/components/debug/SEODebugPanel';
import { getCanonicalBase, applyTemplate, getSafeOrigin } from '@/lib/seo';
import clientLog from '@/lib/client-logger';
import getPropertyUrl from '@/lib/getPropertyUrl';
import { usePropertyTypes } from '@/hooks/usePropertyTypes';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

// BrokerContact importado do tipo compartilhado

interface PublicSiteProps {
  initialBrokerProfile?: BrokerProfile | null;
  initialProperties?: Property[];
}

const PublicSite = ({ initialBrokerProfile, initialProperties }: PublicSiteProps) => {
  // Função para buscar contato do corretor
  const [properties, setProperties] = useState<Property[]>([]);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(initialBrokerProfile || null);
  const [brokerContact, setBrokerContact] = useState<BrokerContact | null>(null);
  interface SocialLink { id: string; platform: string; url: string; icon_url?: string | null; display_order?: number | null; is_active?: boolean; }
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState<boolean>(initialBrokerProfile ? false : true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Colocar slug/toast cedo para serem capturados nos callbacks abaixo
  const router = useRouter(); const { slug, propertySlug  } = router.query;
  const { toast } = useToast();
  const { getBrokerByDomainOrSlug, getPropertiesByDomainOrSlug, isCustomDomain } = useDomainAware();

  const fetchContactInfo = useCallback(async () => {
    try {
      logger.debug('Fetching contact info for:', brokerProfile?.website_slug);
      const { data, error } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: brokerProfile?.website_slug
      });
      logger.debug('Contact RPC response:', { data, error });
      if (error) {
        logger.error('Error fetching contact info:', error);
        return null;
      }
      const contactInfo = data && data.length > 0 ? data[0] : null;
      logger.debug('Parsed contact info:', contactInfo);
      if (contactInfo) {
        setBrokerContact(contactInfo);
        return contactInfo;
      }
      return null;
    } catch (error: unknown) {
      logger.error('Error fetching contact info:', error);
      return null;
    }
  }, [brokerProfile?.website_slug]);

  // Função para contato de lead
  const handleContactLead = async (propertyId: string) => {
    logger.debug('Contact lead for property:', propertyId);
    if (!brokerContact) {
      await fetchContactInfo();
    }
    // handled by SecureContactForm
  };

  // Função para compartilhar imóvel
  const handleShare = useCallback((property: Property) => {
    if (!brokerProfile) return;
    // Compartilhar usando URL correta dependendo do tipo de domínio.
    // - Se for um subdomínio do tipo <slug>.adminimobiliaria.site, o broker slug já está implícito no host,
    //   então o caminho do imóvel deve ser `/propertySlug`.
    // - Se for um domínio customizado (ou se o projeto usar rotas com slug no path), precisamos manter
    //   o comportamento antigo e colocar `/{brokerSlug}/{propertySlug}`.
    const brokerSlug = brokerProfile.website_slug;
    const isCustom = isCustomDomain();
    const propertySlug = property.slug || property.id;
    const shareUrl = getPropertyUrl({
      isCustomDomain: isCustom,
      brokerSlug: brokerSlug,
      propertySlug,
      propertyId: property.id,
    });
    if (navigator.share) {
      navigator.share({
        title: `${property.title} - ${brokerProfile?.business_name}`,
        text: `Confira este imóvel: ${property.title} por ${property.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        url: shareUrl
      });
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Confira este imóvel: ${property.title} por ${property.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n${shareUrl}?t=${Date.now()}`)}`;
      if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
        window.open(whatsappUrl, '_blank');
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copiado!",
          description: "O link do imóvel foi copiado para a área de transferência."
        });
      }
    }
  }, [brokerProfile, toast, isCustomDomain]);

  // Função para favoritar imóvel
  const handleFavorite = useCallback((propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    toast({
      title: favorites.includes(propertyId) ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: favorites.includes(propertyId) 
        ? "O imóvel foi removido da sua lista de favoritos."
        : "O imóvel foi adicionado à sua lista de favoritos."
    });
  }, [favorites, toast]);

  // Função para checar se imóvel está favoritado
  const isFavorited = (propertyId: string) => favorites.includes(propertyId);

  // Função para abrir galeria de imagens
  const handleImageClick = useCallback((images: string[], index: number, title: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxTitle(title);
    setLightboxOpen(true);
  }, []);

  // Função para sucesso no modal de boas-vindas
  const handleWelcomeModalSuccess = useCallback(() => {
    setShowWelcomeModal(false);
    if (slug) {
      localStorage.setItem(`lead-submitted-${slug}`, 'true');
    }
    toast({
      title: "Cadastro realizado!",
      description: "Entraremos em contato em breve.",
    });
  }, [slug, toast]);

  // Safe origin/href values to avoid SSR failures when rendering Helmet
  const origin = getSafeOrigin();
  const href = `${origin}${(typeof window !== 'undefined' ? window.location.pathname + window.location.search + window.location.hash : router.asPath || '')}`;

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    featuredProperties,
    regularProperties,
    hasActiveFilters
  } = usePropertyFilters(properties);

  // Carrega tipos globais ativos para popular o filtro público
  const { groups: typeGroups } = usePropertyTypes();
  const rankGroup = (label: string) => {
    const l = (label || '').toLowerCase();
    if (l.includes('residenciais')) return 0;
    if (l.includes('comerciais')) return 1; // "Comerciais / Empresariais"
    return 10; // demais grupos
  };
  const sortedTypeGroups = useMemo(() => {
    return (typeGroups || []).slice().sort((a, b) => {
      const ra = rankGroup(a.label);
      const rb = rankGroup(b.label);
      if (ra !== rb) return ra - rb;
      return a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });
    });
  }, [typeGroups]);
  const propertyTypeOptions = useMemo(() => sortedTypeGroups.flatMap((g) => g.options.map(o => ({ value: o.value, label: o.label }))), [sortedTypeGroups]);

  const fetchBrokerData = useCallback(async () => {
    try {
      // Garantir que slug seja string | undefined (router.query pode retornar string[])
      const slugString = Array.isArray(slug) ? slug[0] : slug;
      const effectiveSlug = isCustomDomain() ? undefined : slugString;
      logger.debug('Fetching broker data - Custom domain:', isCustomDomain(), 'Slug:', effectiveSlug);
      const brokerData = await getBrokerByDomainOrSlug(effectiveSlug);
      logger.debug('Broker data from domain-aware hook:', brokerData);
      // Diagnostic: log missing/empty broker fields to help debug what's rendered
      const missingBrokerFields: string[] = [];
      const expectedFields = ['id','website_slug','business_name','logo_url','site_favicon_url','site_share_image_url','primary_color','secondary_color','site_title','site_description','tracking_scripts'];
      expectedFields.forEach((f) => {
        if (!(brokerData as any)[f]) missingBrokerFields.push(f);
      });
      if (missingBrokerFields.length > 0) {
        logger.warn('Broker is missing public fields:', { missing: missingBrokerFields });
        try { clientLog('warn', 'broker_missing_fields', { brokerSlug: (brokerData as any)?.website_slug || null, missing: missingBrokerFields }); } catch (e) {}
      } else {
        logger.info('Broker public fields present for', (brokerData as any)?.website_slug || brokerData?.id);
        try { clientLog('info', 'broker_fields_ok', { brokerSlug: (brokerData as any)?.website_slug || null }); } catch (e) {}
      }
      if (!brokerData) {
        logger.warn('No broker found for slug/domain:', effectiveSlug);
        setBrokerProfile(null);
        return;
      }
      // Converte brokerData para BrokerProfile (Row) com cast via unknown para evitar conflito de tipos gerados
      setBrokerProfile(brokerData as unknown as BrokerProfile);
      const propertiesData = await getPropertiesByDomainOrSlug(effectiveSlug, 50, 0);
      const propsArr = (propertiesData || []) as unknown as Property[];
      setProperties(propsArr);
      // Diagnostic: report if properties are empty or items missing expected fields
      if (!propsArr || propsArr.length === 0) {
        logger.warn('No properties returned for broker:', (brokerData as any)?.website_slug || effectiveSlug);
        try { clientLog('warn', 'properties_empty', { brokerSlug: (brokerData as any)?.website_slug || effectiveSlug, count: 0 }); } catch (e) {}
      } else {
        // check for common missing property fields
        const sample = propsArr[0] as any;
        const missingPropertyFields: string[] = [];
        ['id','slug','title','price','main_image_url'].forEach(f => { if (!sample[f]) missingPropertyFields.push(f); });
        if (missingPropertyFields.length > 0) {
          logger.warn('Sample property is missing fields:', missingPropertyFields, 'broker:', (brokerData as any)?.website_slug || effectiveSlug);
          try { clientLog('warn', 'property_missing_fields', { brokerSlug: (brokerData as any)?.website_slug || effectiveSlug, missing: missingPropertyFields, sampleId: sample.id || null }); } catch (e) {}
        } else {
          logger.info('Properties loaded, count:', propsArr.length);
          try { clientLog('info', 'properties_loaded', { brokerSlug: (brokerData as any)?.website_slug || effectiveSlug, count: propsArr.length }); } catch (e) {}
        }
      }
      const { data: socialLinksData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('broker_id', brokerData.id)
        .eq('is_active', true)
        .order('display_order');
      if (!socialError) {
        setSocialLinks((socialLinksData || []) as SocialLink[]);
        const s = (socialLinksData || []) as SocialLink[];
        if (!s || s.length === 0) {
          logger.info('No social links for broker:', (brokerData as any)?.website_slug || effectiveSlug);
          try { clientLog('info', 'social_links_empty', { brokerSlug: (brokerData as any)?.website_slug || effectiveSlug }); } catch (e) {}
        } else {
          logger.info('Social links loaded, count:', s.length);
          try { clientLog('info', 'social_links_loaded', { brokerSlug: (brokerData as any)?.website_slug || effectiveSlug, count: s.length }); } catch (e) {}
        }
      } else {
        logger.warn('Error loading social links for broker:', (brokerData as any)?.website_slug || effectiveSlug, socialError);
        try { clientLog('warn', 'social_links_error', { brokerSlug: (brokerData as any)?.website_slug || effectiveSlug, error: socialError?.message || String(socialError) }); } catch (e) {}
      }
    } catch (error: unknown) {
      logger.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [getBrokerByDomainOrSlug, getPropertiesByDomainOrSlug, isCustomDomain, slug, toast]);

  useEffect(() => {
    // Se o servidor já injetou o broker profile via SSR, use-o imediatamente e pule fetch
    if (initialBrokerProfile) {
      // Diagnostic for SSR-injected broker
      logger.debug('Using initialBrokerProfile from SSR:', initialBrokerProfile);
      const missingFromSSR: string[] = [];
      const expectedFieldsSSR = ['id','website_slug','business_name','logo_url','site_favicon_url','site_share_image_url','primary_color','secondary_color'];
      expectedFieldsSSR.forEach(f => { if (!(initialBrokerProfile as any)[f]) missingFromSSR.push(f); });
      if (missingFromSSR.length > 0) {
        logger.warn('SSR initialBrokerProfile missing fields:', missingFromSSR);
        try { clientLog('warn', 'ssr_broker_missing_fields', { missing: missingFromSSR, brokerSlug: (initialBrokerProfile as any)?.website_slug || null }); } catch (e) {}
      }
      setBrokerProfile(initialBrokerProfile);
      if (initialProperties) setProperties(initialProperties as Property[]);
      setLoading(false);
      return;
    }
    fetchBrokerData();
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  // Check if it's first visit and user hasn't submitted a lead yet
  const visitIdentifier = isCustomDomain() ? (typeof window !== 'undefined' ? window.location.hostname : '') : (Array.isArray(slug) ? slug[0] : slug);
    if (visitIdentifier) {
      const visitKey = `first-visit-${visitIdentifier}`;
      const leadSubmittedKey = `lead-submitted-${visitIdentifier}`;
      const hasVisited = localStorage.getItem(visitKey);
      const hasSubmittedLead = localStorage.getItem(leadSubmittedKey);
      if (!hasVisited && !hasSubmittedLead) {
        localStorage.setItem(visitKey, 'true');
        setTimeout(() => {
          setShowWelcomeModal(true);
        }, 2000);
      }
    }
  }, [slug, fetchBrokerData, isCustomDomain, initialBrokerProfile, initialProperties]);

  // Enviar log ao servidor quando o brokerProfile estiver disponível (após hidratação)
  useEffect(() => {
    if (brokerProfile?.id) {
      clientLog('info', 'broker_profile_loaded', {
        id: brokerProfile.id,
        website_slug: brokerProfile.website_slug,
        favicon: brokerProfile.site_favicon_url,
        share_image: brokerProfile.site_share_image_url,
      });
    }
  }, [brokerProfile?.id, brokerProfile?.website_slug, brokerProfile?.site_favicon_url, brokerProfile?.site_share_image_url]);

  // Fetch contact info when broker profile is loaded
  useEffect(() => {
    if (brokerProfile?.website_slug) {
      logger.info('Broker profile loaded, fetching contact info...');
      fetchContactInfo();
    }
  }, [brokerProfile?.website_slug, fetchContactInfo]);


  // removed duplicate fetchBrokerData

  // duplicatas removidas (definições acima já existem)

  if (loading) {
    return <PublicSiteSkeleton />;
  }

  if (!brokerProfile) {
    logger.warn('public-site: brokerProfile is null for slug/domain', { slug, initialBrokerProfile });
    try { clientLog('warn', 'broker_profile_null', { slug: Array.isArray(slug) ? slug[0] : slug || null }); } catch (e) {}
    return (
      <div className="min-h-screen flex items-center justify-center w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Página não encontrada
          </h1>
          <p className="text-gray-600 mb-4">
            O site "{slug}" não foi encontrado ou não está disponível.
          </p>
          <p className="text-sm text-gray-500">
            Verifique se o URL está correto ou entre em contato com o proprietário do site.
          </p>
        </div>
      </div>
    );
  }


  // Nota: não retornamos a página de detalhes aqui diretamente —
  // precisamos renderizá-la dentro do `ThemeProvider`/Head para que o
  // `brokerProfile` (favicon, cores e meta) sejam aplicados corretamente.

  return (
    <ThemeProvider broker={brokerProfile}>
      {/* Meta tags dinâmicas para cada imobiliária */}
      <Head>
        
        <title>
          {applyTemplate(
            (brokerProfile as unknown as { home_title_template?: string })?.home_title_template,
            {
              business_name: brokerProfile?.business_name || 'Imobiliária',
              properties_count: String(properties?.length || 0)
            }
          ) || (brokerProfile?.site_title || `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação`)}
        </title>
        <meta 
          name="description" 
          content={
            applyTemplate(
              (brokerProfile as unknown as { home_description_template?: string })?.home_description_template,
              {
                business_name: brokerProfile?.business_name || 'Imobiliária',
                properties_count: String(properties?.length || 0)
              }
            ) || (brokerProfile?.site_description || `Encontre imóveis com ${brokerProfile?.business_name || 'nossa imobiliária'}. ${properties.length} propriedades disponíveis para venda e locação.`)
          } 
        />
        
        {/* Favicon */}
        {brokerProfile?.site_favicon_url && (
          <link 
              rel="icon" 
              href={brokerProfile.site_favicon_url.startsWith('http') ? 
                brokerProfile.site_favicon_url : 
                `${origin}${brokerProfile.site_favicon_url}`
              } 
              type="image/png" 
            />
        )}
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content={
            brokerProfile?.site_title || 
            `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação`
          } 
        />
        <meta 
          property="og:description" 
          content={
            brokerProfile?.site_description || 
            `Encontre seu imóvel dos sonhos com ${brokerProfile?.business_name || 'nossa imobiliária'}. ${properties.length} propriedades disponíveis.`
          } 
        />
        <meta 
          property="og:image" 
          content={
            brokerProfile?.site_share_image_url ? 
              (brokerProfile.site_share_image_url.startsWith('http') ? 
                brokerProfile.site_share_image_url : 
                `${origin}${brokerProfile.site_share_image_url}`) :
              brokerProfile?.logo_url ? 
                (brokerProfile.logo_url.startsWith('http') ? 
                  brokerProfile.logo_url : 
                  `${origin}${brokerProfile.logo_url}`) :
                `${origin}/placeholder.svg`
          } 
        />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={brokerProfile?.business_name || 'Imobiliária'} />
  <meta property="og:url" content={href} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta 
          name="twitter:title" 
          content={
            brokerProfile?.site_title || 
            `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação`
          } 
        />
        <meta 
          name="twitter:description" 
          content={
            brokerProfile?.site_description || 
            `Encontre seu imóvel dos sonhos com ${brokerProfile?.business_name || 'nossa imobiliária'}. ${properties.length} propriedades disponíveis.`
          } 
        />
        <meta 
          name="twitter:image" 
          content={
            brokerProfile?.site_share_image_url ? 
              (brokerProfile.site_share_image_url.startsWith('http') ? 
                brokerProfile.site_share_image_url : 
                `${origin}${brokerProfile.site_share_image_url}`) :
              brokerProfile?.logo_url ? 
                (brokerProfile.logo_url.startsWith('http') ? 
                  brokerProfile.logo_url : 
                  `${origin}${brokerProfile.logo_url}`) :
                `${origin}/placeholder.svg`
          } 
        />
        
        {/* Canonical URL */}
  <link rel="canonical" href={getCanonicalBase(brokerProfile, origin)} />
  <meta name="robots" content={`${((brokerProfile as unknown as { robots_index?: boolean })?.robots_index ?? true) ? 'index' : 'noindex'}, ${((brokerProfile as unknown as { robots_follow?: boolean })?.robots_follow ?? true) ? 'follow' : 'nofollow'}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Inline theme CSS for SSR to avoid initial flash of unstyled brand colors.
            We set both --color-* and shorter aliases (--primary/--secondary) used in global CSS. */}
        {(brokerProfile?.primary_color || (brokerProfile as any)?.brand_primary || brokerProfile?.secondary_color || (brokerProfile as any)?.brand_secondary) && (
          <style id="tenant-theme">{`
            :root {
              ${brokerProfile?.primary_color || (brokerProfile as any)?.brand_primary ? `--color-primary: ${brokerProfile?.primary_color || (brokerProfile as any)?.brand_primary}; --primary: ${brokerProfile?.primary_color || (brokerProfile as any)?.brand_primary};` : ''}
              ${brokerProfile?.secondary_color || (brokerProfile as any)?.brand_secondary ? `--color-secondary: ${brokerProfile?.secondary_color || (brokerProfile as any)?.brand_secondary}; --secondary: ${brokerProfile?.secondary_color || (brokerProfile as any)?.brand_secondary};` : ''}
            }
          `}</style>
        )}

        {/* JSON-LD Structured Data: Organization/RealEstateAgent */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'RealEstateAgent',
            name: brokerProfile?.business_name || brokerProfile?.display_name || 'Imobiliária',
            url: href || undefined,
            logo: brokerProfile?.logo_url
              ? (brokerProfile.logo_url.startsWith('http')
                  ? brokerProfile.logo_url
                  : `${origin}${brokerProfile.logo_url}`)
              : undefined,
          })}
        </script>
      </Head>
      
      <div className="public-site-layout min-h-screen bg-background">
        {/* 🔍 PAINEL DE DEBUG - apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-xl max-w-sm text-xs font-mono">
            <h3 className="font-bold mb-2 text-sm">🐛 Debug Info</h3>
            <div className="space-y-1">
              <div>Broker: <span className="text-green-400">{brokerProfile?.business_name || 'N/A'}</span></div>
              <div>Slug: <span className="text-blue-400">{brokerProfile?.website_slug || 'N/A'}</span></div>
              <div>Propriedades: <span className="text-yellow-400">{properties.length}</span></div>
              <div>PropertySlug param: <span className="text-purple-400">{propertySlug || 'N/A'}</span></div>
              <div>Custom Domain: <span className="text-cyan-400">{isCustomDomain() ? 'Sim' : 'Não'}</span></div>
              <div>SSR: <span className="text-pink-400">{initialBrokerProfile ? 'Sim' : 'Não'}</span></div>
            </div>
          </div>
        )}

        {propertySlug ? (
          // Página de detalhe renderizada dentro do layout para garantir Head/Theme
          <PropertyDetailPage 
            initialBrokerProfile={brokerProfile}
            propertySlug={propertySlug as string}
          />
        ) : (
          <>
            <TrackingScripts trackingScripts={brokerProfile?.tracking_scripts} />
            <FixedHeader brokerProfile={brokerProfile} />
            <HeroBanner brokerProfile={brokerProfile} />
          
            <div id="search" className="w-full py-8">
              <div className="content-container">
                <SearchFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filters={filters}
                  setFilters={setFilters}
                  hasActiveFilters={hasActiveFilters}
                  primaryColor={brokerProfile?.primary_color || '#2563eb'}
                  secondaryColor={brokerProfile?.secondary_color || '#64748b'}
                  propertyTypeOptions={propertyTypeOptions}
                  propertyTypeGroups={sortedTypeGroups.map(g => ({ label: g.label, options: g.options.map(o => ({ value: o.value, label: o.label })) }))}
                />
              </div>
            </div>

            {featuredProperties.length > 0 && (
              <FeaturedProperties
                properties={featuredProperties}
                brokerProfile={brokerProfile}
                onContactLead={handleContactLead}
                onShare={handleShare}
                onFavorite={handleFavorite}
                isFavorited={isFavorited}
                onImageClick={handleImageClick}
              />
            )}

            {featuredProperties.length > 0 && regularProperties.length > 0 && (
              <div className="content-container py-8">
                <Separator className="bg-black/20" />
              </div>
            )}

          {regularProperties.length > 0 && (
            <PropertiesGrid
              properties={regularProperties}
              brokerProfile={brokerProfile}
              onContactLead={handleContactLead}
              onShare={handleShare}
              onFavorite={handleFavorite}
              isFavorited={isFavorited}
              onImageClick={handleImageClick}
            />
          )}

            <WhatsAppFloat 
              brokerProfile={brokerProfile} 
              onContactRequest={fetchContactInfo}
            />
          </>
        )}
      </div>

    {/* Contact CTA Section - Fora do container principal para ocupar toda a largura */}
    {properties.length > 0 && (
      <ContactCTA brokerProfile={brokerProfile} />
    )}

    {/* Footer - Fora do container principal para ocupar toda a largura */}
    <Footer 
      brokerProfile={brokerProfile} 
      socialLinks={socialLinks} 
      onContactRequest={fetchContactInfo}
    />

    {/* Welcome Modal for first-time visitors */}
    <LeadModal
      isOpen={showWelcomeModal}
      onClose={() => setShowWelcomeModal(false)}
      onSuccess={handleWelcomeModalSuccess}
      brokerProfile={brokerProfile}
      source="welcome_modal"
    />
    </ThemeProvider>
  );
};

export default PublicSite;

import { getPublicBrokerByHost } from '@/lib/server/brokerService';

export async function getServerSideProps(context: any) {
  try {
    const headers = context.req?.headers || {};
    const hostname = (headers['x-hostname'] || headers['host'] || '') as string;
    const brokerSlug = (headers['x-broker-slug'] || '') as string;
    const customDomain = (headers['x-custom-domain'] || '') as string;

    // Simple in-memory cache to avoid repeating broker lookups on each SSR request
    const cacheKey = brokerSlug || customDomain || hostname || 'unknown';
    const globalAny: any = globalThis as any;
    if (!globalAny.__publicSiteBrokerCache) globalAny.__publicSiteBrokerCache = new Map();
    const brokerCache: Map<string, { value: any; expiresAt: number }> = globalAny.__publicSiteBrokerCache;
    const TTL = 1000 * 60 * 2; // 2 minutes

    const cached = brokerCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { props: { initialBrokerProfile: cached.value || null } };
    }

    // Delegate to server-side service that returns only public fields
    const broker = await getPublicBrokerByHost({ hostname: String(hostname || ''), brokerSlug: String(brokerSlug || ''), customDomain: String(customDomain || '') });

    // populate cache
    brokerCache.set(cacheKey, { value: broker || null, expiresAt: Date.now() + TTL });

    return {
      props: {
        initialBrokerProfile: broker || null,
      },
    };
  } catch (e) {
    return { props: { initialBrokerProfile: null } };
  }
}
