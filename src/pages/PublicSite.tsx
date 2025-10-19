import type { BrokerProfile, BrokerContact } from '@/types/broker';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import { getCanonicalBase, applyTemplate } from '@/lib/seo';
import { usePropertyTypes } from '@/hooks/usePropertyTypes';


interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  transaction_type: string;
  address: string;
  neighborhood: string;
  city: string;
  uf: string;
  bedrooms: number;
  bathrooms: number;
  area_m2: number;
  parking_spaces: number;
  is_featured: boolean;
  views_count: number;
  main_image_url: string;
  images: string[];
  features: string[];
  property_code?: string;
  status: string;
  slug?: string;
}

// BrokerContact importado do tipo compartilhado

const PublicSite = () => {
  // Função para buscar contato do corretor
  const fetchContactInfo = async () => {
    try {
      console.log('Fetching contact info for:', brokerProfile?.website_slug);
      const { data, error } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: brokerProfile?.website_slug
      });
      console.log('Contact RPC response:', { data, error });
      if (error) {
        console.error('Error fetching contact info:', error);
        return null;
      }
      const contactInfo = data && data.length > 0 ? data[0] : null;
      console.log('Parsed contact info:', contactInfo);
      if (contactInfo) {
        setBrokerContact(contactInfo);
        return contactInfo;
      }
      return null;
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return null;
    }
  };

  // Função para contato de lead
  const handleContactLead = async (propertyId: string) => {
    console.log('Contact lead for property:', propertyId);
    if (!brokerContact) {
      await fetchContactInfo();
    }
    // handled by SecureContactForm
  };

  // Função para compartilhar imóvel
  const handleShare = (property: Property) => {
    if (!brokerProfile) return;
    // Compartilhar usando URL direta baseada no slug do corretor e do imóvel
    const brokerSlug = brokerProfile.website_slug;
    const shareUrl = `${window.location.origin}/${brokerSlug}/${property.slug || property.id}`;
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
  };

  // Função para favoritar imóvel
  const handleFavorite = (propertyId: string) => {
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
  };

  // Função para checar se imóvel está favoritado
  const isFavorited = (propertyId: string) => favorites.includes(propertyId);

  // Função para abrir galeria de imagens
  const handleImageClick = (images: string[], index: number, title: string) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxTitle(title);
    setLightboxOpen(true);
  };

  // Função para sucesso no modal de boas-vindas
  const handleWelcomeModalSuccess = () => {
    setShowWelcomeModal(false);
    if (slug) {
      localStorage.setItem(`lead-submitted-${slug}`, 'true');
    }
    toast({
      title: "Cadastro realizado!",
      description: "Entraremos em contato em breve.",
    });
  };
  const { slug, propertySlug } = useParams();
  const { toast } = useToast();
  const { getBrokerByDomainOrSlug, getPropertiesByDomainOrSlug, isCustomDomain } = useDomainAware();
  const [properties, setProperties] = useState<Property[]>([]);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);
  const [brokerContact, setBrokerContact] = useState<BrokerContact | null>(null);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
  const sortedTypeGroups = (typeGroups || []).slice().sort((a, b) => {
    const ra = rankGroup(a.label);
    const rb = rankGroup(b.label);
    if (ra !== rb) return ra - rb;
    return a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });
  });
  const propertyTypeOptions = sortedTypeGroups.flatMap((g) => g.options.map(o => ({ value: o.value, label: o.label })));

  useEffect(() => {
    fetchBrokerData();
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    // Check if it's first visit and user hasn't submitted a lead yet
    const visitIdentifier = isCustomDomain() ? window.location.hostname : slug;
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
  }, [slug]);

  // Fetch contact info when broker profile is loaded
  useEffect(() => {
    if (brokerProfile?.website_slug) {
      console.log('Broker profile loaded, fetching contact info...');
      fetchContactInfo();
    }
  }, [brokerProfile]);


  const fetchBrokerData = async () => {
    try {
      const effectiveSlug = isCustomDomain() ? undefined : slug;
      console.log('Fetching broker data - Custom domain:', isCustomDomain(), 'Slug:', effectiveSlug);
      const brokerData = await getBrokerByDomainOrSlug(effectiveSlug);
      console.log('Broker data from domain-aware hook:', brokerData);
      if (!brokerData) {
        console.log('No broker found for slug/domain:', effectiveSlug);
        setBrokerProfile(null);
        return;
      }
  // Converte brokerData para BrokerProfile (Row) com cast via unknown para evitar conflito de tipos gerados
  setBrokerProfile(brokerData as unknown as BrokerProfile);
      const propertiesData = await getPropertiesByDomainOrSlug(effectiveSlug, 50, 0);
      setProperties(propertiesData || []);
      const { data: socialLinksData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('broker_id', brokerData.id)
        .eq('is_active', true)
        .order('display_order');
      if (!socialError) {
        setSocialLinks(socialLinksData || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message || 'Erro desconhecido ao carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
      <Helmet>
        
        <title>
          {applyTemplate(
            (brokerProfile as any)?.home_title_template,
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
              (brokerProfile as any)?.home_description_template,
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
              `${window.location.origin}${brokerProfile.site_favicon_url}`
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
                `${window.location.origin}${brokerProfile.site_share_image_url}`) :
              brokerProfile?.logo_url ? 
                (brokerProfile.logo_url.startsWith('http') ? 
                  brokerProfile.logo_url : 
                  `${window.location.origin}${brokerProfile.logo_url}`) :
                `${window.location.origin}/placeholder.svg`
          } 
        />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={brokerProfile?.business_name || 'Imobiliária'} />
        <meta property="og:url" content={window.location.href} />
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
                `${window.location.origin}${brokerProfile.site_share_image_url}`) :
              brokerProfile?.logo_url ? 
                (brokerProfile.logo_url.startsWith('http') ? 
                  brokerProfile.logo_url : 
                  `${window.location.origin}${brokerProfile.logo_url}`) :
                `${window.location.origin}/placeholder.svg`
          } 
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href={getCanonicalBase(brokerProfile, window.location.origin)} />
  <meta name="robots" content={`${((brokerProfile as any)?.robots_index ?? true) ? 'index' : 'noindex'}, ${((brokerProfile as any)?.robots_follow ?? true) ? 'follow' : 'nofollow'}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* JSON-LD Structured Data: Organization/RealEstateAgent */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'RealEstateAgent',
            name: brokerProfile?.business_name || brokerProfile?.display_name || 'Imobiliária',
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            logo: brokerProfile?.logo_url
              ? (brokerProfile.logo_url.startsWith('http')
                  ? brokerProfile.logo_url
                  : `${typeof window !== 'undefined' ? window.location.origin : ''}${brokerProfile.logo_url}`)
              : undefined,
          })}
        </script>
      </Helmet>
      
      <div className="public-site-layout min-h-screen bg-white">
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
