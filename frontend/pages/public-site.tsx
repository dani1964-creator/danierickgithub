import type { BrokerProfile, BrokerContact } from '@/shared/types/broker';
import type { Property } from '@/shared/types/tenant';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePropertyFilters } from '@/hooks/usePropertyFilters';
import { PublicSiteSkeleton } from '@/components/ui/loading-skeleton';
import HeroBanner from '@/components/home/HeroBanner';
import SearchFilters from '@/components/home/SearchFilters';
import FixedHeader from '@/components/home/FixedHeader';
import TrackingScripts from '@/components/tracking/TrackingScripts';
import PropertyDetailPage from '@/components/properties/PropertyDetailPage';
import { EnhancedSecurity } from '@/lib/enhanced-security';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useDomainAware } from '@/hooks/useDomainAware';
import { SEODebugPanel } from '@/components/debug/SEODebugPanel';
import { getCanonicalBase, applyTemplate } from '@/lib/seo';
import { FloatingFavoritesButton } from '@/components/FavoritesButton';
import { usePropertyTypes } from '@/hooks/usePropertyTypes';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy loading de componentes pesados para melhor performance
const CategorySection = dynamic(() => import('@/components/home/CategorySection'), {
  loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>,
});
const FeaturedProperties = dynamic(() => import('@/components/home/FeaturedProperties'), {
  loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>,
});
const PropertiesGrid = dynamic(() => import('@/components/home/PropertiesGrid'), {
  loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>,
});
const ContactCTA = dynamic(() => import('@/components/home/ContactCTA'), {
  loading: () => <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>,
});
const Footer = dynamic(() => import('@/components/home/Footer'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>,
});
const WhatsAppFloat = dynamic(() => import('@/components/home/WhatsAppFloat'), {
  ssr: false, // Componente de WhatsApp não precisa de SSR
});
const LeadModal = dynamic(() => import('@/components/leads/LeadModal'), {
  ssr: false, // Modal não precisa de SSR
});

// BrokerContact importado do tipo compartilhado

// Cache simples em memória para dados do broker (evita refetch desnecessário)
const brokerCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const PublicSite = () => {
  // Função para buscar contato do corretor
  const [properties, setProperties] = useState<Property[]>([]);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);
  const [brokerContact, setBrokerContact] = useState<BrokerContact | null>(null);
  interface SocialLink { id: string; platform: string; url: string; icon_url?: string | null; display_order?: number | null; is_active?: boolean; }
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Estado para categorias dinâmicas
  interface CategoryWithProperties {
    category_id: string;
    category_name: string;
    category_slug: string;
    category_description: string | null;
    category_color: string | null;
    category_icon: string | null;
    category_display_order: number;
    properties: Property[];
  }
  const [categoriesWithProperties, setCategoriesWithProperties] = useState<CategoryWithProperties[]>([]);
  const [useDynamicCategories, setUseDynamicCategories] = useState(false);

  // Estado de dark mode sincronizado com PropertyDetailPage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dark-mode-enabled');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Colocar slug/toast cedo para serem capturados nos callbacks abaixo
  const router = useRouter(); const { slug, propertySlug  } = router.query;
  const { toast } = useToast();
  const { getBrokerByDomainOrSlug, getPropertiesByDomainOrSlug, isCustomDomain } = useDomainAware();

  // Aplicar classe dark ao documento quando isDarkMode mudar
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('dark-mode-enabled', JSON.stringify(newMode));
      return newMode;
    });
  }, []);

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
    const shareUrl = isCustom
      ? `${window.location.origin}/${brokerSlug}/${property.slug || property.id}`
      : `${window.location.origin}/${property.slug || property.id}`;
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
    // Usar hostname para consistência com a verificação de primeira visita
    const visitIdentifier = typeof window !== 'undefined' ? window.location.hostname : '';
    if (visitIdentifier) {
      localStorage.setItem(`lead-submitted-${visitIdentifier}`, 'true');
    }
    toast({
      title: "Cadastro realizado!",
      description: "Entraremos em contato em breve.",
    });
  }, [toast]);

  // Safe origin/href values to avoid SSR failures when rendering Helmet
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const href = typeof window !== 'undefined' ? window.location.href : '';

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    featuredProperties,
    regularProperties,
    hasActiveFilters
  } = usePropertyFilters(properties);

  // DEBUG: Log para verificar se propriedades estão sendo carregadas
  useEffect(() => {
    logger.info('📊 Properties state updated:', {
      total: properties.length,
      featured: featuredProperties.length,
      regular: regularProperties.length,
      useDynamicCategories,
      categoriesCount: categoriesWithProperties.length
    });
  }, [properties, featuredProperties, regularProperties, useDynamicCategories, categoriesWithProperties]);

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

  const fetchBrokerData = useCallback(async (forceRefresh = false) => {
    try {
      // Garantir que slug seja string | undefined (router.query pode retornar string[])
      const slugString = Array.isArray(slug) ? slug[0] : slug;
      
      // Se não há slug na query e não é domínio customizado, extrair do hostname
      let effectiveSlug = isCustomDomain() ? undefined : slugString;
      
      if (!effectiveSlug && !isCustomDomain() && typeof window !== 'undefined') {
        // Extrair slug do hostname (ex: rfimobiliaria.adminimobiliaria.site -> rfimobiliaria)
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'adminimobiliaria.site';
        const hostname = window.location.hostname;
        if (hostname.endsWith(`.${baseDomain}`)) {
          effectiveSlug = hostname.slice(0, -(baseDomain.length + 1));
          logger.debug('Extracted slug from hostname:', effectiveSlug);
        }
      }
      
      const cacheKey = effectiveSlug || (typeof window !== 'undefined' ? window.location.hostname : '');
      
      // Verificar cache (apenas se não for refresh forçado)
      if (!forceRefresh) {
        const cached = brokerCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          logger.debug('Using cached broker data for:', cacheKey);
          setBrokerProfile(cached.data.broker);
          setProperties(cached.data.properties);
          setSocialLinks(cached.data.socialLinks);
          setLoading(false);
          return;
        }
      }
      
      logger.debug('Fetching broker data - Custom domain:', isCustomDomain(), 'Slug:', effectiveSlug, 'Force refresh:', forceRefresh);
      const brokerData = await getBrokerByDomainOrSlug(effectiveSlug);
      logger.debug('Broker data from domain-aware hook:', brokerData);
      if (!brokerData) {
        logger.warn('No broker found for slug/domain:', effectiveSlug);
        setBrokerProfile(null);
        return;
      }
      // Converte brokerData para BrokerProfile (Row) com cast via unknown para evitar conflito de tipos gerados
      setBrokerProfile(brokerData as unknown as BrokerProfile);
      const propertiesData = await getPropertiesByDomainOrSlug(effectiveSlug, 50, 0);
      logger.info('✅ Properties fetched from database:', {
        count: propertiesData?.length || 0,
        sample: propertiesData?.[0] ? {
          id: propertiesData[0].id,
          title: propertiesData[0].title,
          views_count: propertiesData[0].views_count
        } : null
      });
      setProperties((propertiesData || []) as unknown as Property[]);
      
      // Tentar carregar categorias dinâmicas (apenas se tabelas existirem)
      if (brokerData?.id) {
        try {
          // Usar a nova função RPC corrigida com parâmetros adequados
          const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
          const rpcParams = isCustomDomain() 
            ? { custom_domain_param: currentHostname }
            : { broker_slug_param: effectiveSlug };
          
          // Nova função RPC será criada com os scripts SQL
          const { data: categoriesData, error: categoriesError } = await (supabase as any)
            .rpc('get_homepage_categories_with_properties', rpcParams);
          
          if (!categoriesError && categoriesData) {
            // A RPC corrigida retorna TABLE (array de objetos) com dados consistentes
            const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
            
            if (categoriesArray && categoriesArray.length > 0) {
              logger.debug('✅ Loaded dynamic categories with consistent data:', categoriesArray.length);
              setCategoriesWithProperties(categoriesArray.map((cat: any) => ({
                category_id: cat.category_id,
                category_name: cat.category_name,
                category_slug: cat.category_slug || cat.category_name.toLowerCase().replace(/\s+/g, '-'),
                category_description: cat.category_description,
                category_color: cat.category_color || '#2563eb',
                category_icon: cat.category_icon || 'Star',
                category_display_order: cat.category_display_order || 0,
                // Garantir que propriedades sempre tenham dados completos
                properties: (cat.properties || []).map((prop: any) => ({
                  ...prop,
                  neighborhood: prop.neighborhood || 'Bairro não informado',
                  views_count: prop.views_count || 0,
                  status: prop.status || 'available',
                  images: prop.images || []
                }))
              })));
              setUseDynamicCategories(true);
            } else {
              logger.warn('⚠️ No dynamic categories found, using legacy sections');
              setUseDynamicCategories(false);
            }
          } else {
            logger.warn('⚠️ RPC error or no data:', categoriesError?.message);
            setUseDynamicCategories(false);
          }
        } catch (error) {
          logger.warn('⚠️ Categories system not migrated yet, using legacy sections:', error);
          setUseDynamicCategories(false);
        }
      } else {
        logger.debug('No broker ID, using legacy sections');
        setUseDynamicCategories(false);
      }
      
      const { data: socialLinksData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('broker_id', brokerData.id)
        .eq('is_active', true)
        .order('display_order');
      if (!socialError) {
        setSocialLinks((socialLinksData || []) as SocialLink[]);
      }
      
      // Salvar no cache
      brokerCache.set(cacheKey, {
        data: {
          broker: brokerData,
          properties: propertiesData || [],
          socialLinks: socialLinksData || []
        },
        timestamp: Date.now()
      });
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
    fetchBrokerData();
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  // Check if it's first visit and user hasn't submitted a lead yet
  // Usar sempre o hostname como identificador único (mais confiável que slug)
  const visitIdentifier = typeof window !== 'undefined' ? window.location.hostname : '';
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
  }, [slug, fetchBrokerData, isCustomDomain]);

  // Invalidar cache quando usuário volta para a página (ex: depois de ver detalhes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Limpar TODOS os caches quando página fica visível
        brokerCache.clear();
        logger.info('Cache cleared on page visibility, reloading fresh data...');
        // Recarregar dados atualizados COM FORÇA (bypass do cache)
        fetchBrokerData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchBrokerData]);

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

  // Se há um propertySlug na URL, mostrar página de detalhes
  if (propertySlug) {
    return <PropertyDetailPage />;
  }

  return (
    <ThemeProvider broker={brokerProfile}>
      {/* Meta tags dinâmicas para cada imobiliária */}
      <Head>
        
        {/* Preconnect para domínios externos - reduz latência de DNS/TLS */}
        <link rel="preconnect" href="https://xyzcompany.supabase.co" />
        <link rel="dns-prefetch" href="https://xyzcompany.supabase.co" />
        
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
        
        {/* Favicon - usa configuração do corretor ou logo como fallback */}
        {brokerProfile?.site_favicon_url ? (
          <>
            <link 
              rel="icon" 
              href={brokerProfile.site_favicon_url.startsWith('http') ? 
                brokerProfile.site_favicon_url : 
                `${origin}${brokerProfile.site_favicon_url}`
              } 
              type="image/png" 
            />
            <link 
              rel="apple-touch-icon" 
              href={brokerProfile.site_favicon_url.startsWith('http') ? 
                brokerProfile.site_favicon_url : 
                `${origin}${brokerProfile.site_favicon_url}`
              }
            />
          </>
        ) : brokerProfile?.logo_url ? (
          <>
            <link 
              rel="icon" 
              href={brokerProfile.logo_url.startsWith('http') ? 
                brokerProfile.logo_url : 
                `${origin}${brokerProfile.logo_url}`
              } 
              type="image/png" 
            />
            <link 
              rel="apple-touch-icon" 
              href={brokerProfile.logo_url.startsWith('http') ? 
                brokerProfile.logo_url : 
                `${origin}${brokerProfile.logo_url}`
              }
            />
          </>
        ) : null}
        
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
              brokerProfile?.header_brand_image_url ?
                (brokerProfile.header_brand_image_url.startsWith('http') ?
                  brokerProfile.header_brand_image_url :
                  `${origin}${brokerProfile.header_brand_image_url}`) :
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
      <TrackingScripts trackingScripts={brokerProfile?.tracking_scripts} />
      <FixedHeader brokerProfile={brokerProfile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <HeroBanner brokerProfile={brokerProfile} isDarkMode={isDarkMode} />
      
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
            brokerProfile={brokerProfile}
            propertyTypeOptions={propertyTypeOptions}
            propertyTypeGroups={sortedTypeGroups.map(g => ({ label: g.label, options: g.options.map(o => ({ value: o.value, label: o.label })) }))}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Renderização Dinâmica de Categorias */}
      {useDynamicCategories && categoriesWithProperties.length > 0 ? (
        // Sistema NOVO: Categorias personalizáveis
        categoriesWithProperties.map((category, index) => (
          <div key={category.category_id}>
            <CategorySection
              category={{
                id: category.category_id,
                name: category.category_name,
                slug: category.category_slug,
                description: category.category_description,
                color: category.category_color,
                icon: category.category_icon,
                display_order: category.category_display_order,
                is_active: true,
                show_on_homepage: true
              }}
              properties={category.properties}
              brokerProfile={brokerProfile}
              onContactLead={handleContactLead}
              onShare={handleShare}
              onFavorite={handleFavorite}
              isFavorited={isFavorited}
              onImageClick={handleImageClick}
              isDarkMode={isDarkMode}
            />
            {index < categoriesWithProperties.length - 1 && (
              <div className="content-container py-8">
                <Separator className="bg-black/20" />
              </div>
            )}
          </div>
        ))
      ) : (
        // Sistema LEGADO: FeaturedProperties + PropertiesGrid
        <>
          {featuredProperties.length > 0 && (
            <FeaturedProperties
              properties={featuredProperties}
              brokerProfile={brokerProfile}
              onContactLead={handleContactLead}
              onShare={handleShare}
              onFavorite={handleFavorite}
              isFavorited={isFavorited}
              onImageClick={handleImageClick}
              isDarkMode={isDarkMode}
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
              isDarkMode={isDarkMode}
            />
          )}
        </>
      )}

      <WhatsAppFloat 
        brokerProfile={brokerProfile} 
        onContactRequest={fetchContactInfo}
      />
    </div>

    {/* Contact CTA Section - Fora do container principal para ocupar toda a largura */}
    {properties.length > 0 && (
      <ContactCTA brokerProfile={brokerProfile} isDarkMode={isDarkMode} />
    )}

    {/* Footer - Fora do container principal para ocupar toda a largura */}
    <Footer 
      brokerProfile={brokerProfile} 
      socialLinks={socialLinks} 
      onContactRequest={fetchContactInfo}
      isDarkMode={isDarkMode}
    />

    {/* Floating Favorites Button */}
    <FloatingFavoritesButton />

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

const DynamicPublicSite = dynamic(() => Promise.resolve(PublicSite), { ssr: false });
export default DynamicPublicSite;
