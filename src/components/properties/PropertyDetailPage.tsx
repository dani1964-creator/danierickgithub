import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, MapPin, Bed, Bath, Car, Square, Eye, Heart, Share2, MessageCircle, Phone, Mail, X, Play, Maximize2, ArrowLeft, Star, Calendar, Users, Zap } from 'lucide-react';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedSecurity } from '@/lib/enhanced-security';
import { useTracking } from '@/hooks/useTracking';
import { useIsMobile } from '@/hooks/use-mobile';
import ContactCTA from '@/components/home/ContactCTA';
import Footer from '@/components/home/Footer';
import MobileRealtorCard from './MobileRealtorCard';
import LeadModal from '@/components/leads/LeadModal';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  transaction_type: string;
  address: string;
  neighborhood: string;
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
  property_code: string;
  slug?: string;
  realtor_id?: string;
  realtor_name?: string;
  realtor_avatar_url?: string;
  realtor_creci?: string;
  realtor_bio?: string;
  realtor_whatsapp_button_text?: string;
  // Campos opcionais - Informações gerais
  hoa_fee?: number | null;
  hoa_periodicity?: string | null;
  iptu_value?: number | null;
  iptu_periodicity?: string | null;
  built_year?: number | null;
  suites?: number | null;
  private_area_m2?: number | null;
  total_area_m2?: number | null;
  covered_parking_spaces?: number | null;
  floor_number?: number | null;
  total_floors?: number | null;
  sunlight_orientation?: string | null;
  property_condition?: string | null;
  water_cost?: number | null;
  electricity_cost?: number | null;
  furnished?: boolean | null;
  accepts_pets?: boolean | null;
  elevator?: boolean | null;
  portaria_24h?: boolean | null;
  gas_included?: boolean | null;
  accessibility?: boolean | null;
  heating_type?: string | null;
  notes?: string | null;
}

import type { BrokerProfile, BrokerContact } from '@/types/broker';

const PropertyDetailPage = () => {
  const { slug, propertySlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackPropertyView, trackPropertyInterest, trackWhatsAppClick } = useTracking();
  const isMobile = useIsMobile();
  const [property, setProperty] = useState<Property | null>(null);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);
  const [brokerContact, setBrokerContact] = useState<BrokerContact | null>(null);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [thumbnailCarouselApi, setThumbnailCarouselApi] = useState<CarouselApi>();
  const [activeTab, setActiveTab] = useState<'Detalhes' | 'Características'>('Detalhes');

  useEffect(() => {
    if (propertySlug && slug) {
      fetchPropertyData();
    }
  }, [propertySlug, slug]);

  const fetchPropertyData = async () => {
    try {
      console.log('Fetching property data for:', { propertySlug, slug });
      
      // Use the new RPC function that bypasses RLS for public access to realtor data
      const { data: propertyDataArray, error: propertyError } = await supabase
        .rpc('get_public_property_detail_with_realtor', {
          broker_slug: slug,
          property_slug: propertySlug
        });

      console.log('Property data from RPC:', propertyDataArray);

      if (propertyError) {
        console.error('Property error:', propertyError);
        throw propertyError;
      }

      if (!propertyDataArray || propertyDataArray.length === 0) {
        throw new Error('Propriedade não encontrada');
      }

      const propertyData = propertyDataArray[0];
      console.log('Property data:', propertyData);

      // Fetch broker profile using the existing RPC function
      const { data: brokerDataArray, error: brokerError } = await supabase
        .rpc('get_public_broker_branding', { broker_website_slug: slug });

      console.log('Broker data array:', brokerDataArray);
      
      const brokerData = brokerDataArray?.[0];
      console.log('Broker data:', brokerData);

      if (brokerError) {
        console.error('Broker error:', brokerError);
        throw brokerError;
      }

      if (!brokerData) {
        throw new Error('Corretor não encontrado');
      }

      // Fetch similar properties
      const { data: similarData, error: similarError } = await supabase
        .from('properties')
        .select('*, slug')
        .eq('is_active', true)
        .eq('property_type', propertyData.property_type)
        .eq('transaction_type', propertyData.transaction_type)
        .eq('broker_id', brokerData.id) // Use the broker's ID from broker profile
        .neq('id', propertyData.id)
        .limit(6);

      if (similarError) throw similarError;

      // Fetch social links
      const { data: socialData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('broker_id', brokerData.id)
        .eq('is_active', true);

      if (socialError) {
        console.warn('Error fetching social links:', socialError);
      }

      console.log('Realtor data from RPC:', {
        realtor_name: propertyData.realtor_name,
        realtor_avatar_url: propertyData.realtor_avatar_url,
        realtor_creci: propertyData.realtor_creci
      });

      setProperty(propertyData);
      setBrokerProfile(brokerData as unknown as BrokerProfile);
      setSimilarProperties(similarData || []);
      setSocialLinks(socialData || []);
      setViewsCount(propertyData.views_count || 0);

      // Update views count
      const updatedViews = (propertyData.views_count || 0) + 1;
      await supabase
        .from('properties')
        .update({ views_count: updatedViews })
        .eq('id', propertyData.id);
      
      setViewsCount(updatedViews);

      // Track property view for pixels
      if (propertyData) {
        trackPropertyView({
          property_id: propertyData.id,
          title: propertyData.title,
          price: propertyData.price,
          type: propertyData.property_type,
          city: propertyData.uf
        });
      }

    } catch (error: any) {
      toast({
        title: "Erro ao carregar imóvel",
        description: error.message,
        variant: "destructive"
      });
      navigate(`/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPeriodicityLabel = (p?: string | null) => {
    if (!p) return '';
    const map: Record<string, string> = {
      monthly: 'mês',
      annual: 'ano',
      yearly: 'ano',
      other: 'período',
    };
    return map[p] || p;
  };

  const FeeBadge = ({ label, amount, periodicity }: { label: string; amount?: number | null; periodicity?: string | null }) => {
    if (amount == null || isNaN(amount as number)) return null;
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700 text-xs sm:text-sm">
        <span className="font-medium text-gray-900">{label}:</span>
        <span>{formatPrice(amount)}</span>
        {periodicity && (
          <span className="text-gray-500">/ {getPeriodicityLabel(periodicity)}</span>
        )}
      </span>
    );
  };

  const handleContactLead = async () => {
    console.log('handleContactLead chamada - Dados:', {
      property: property?.id,
      brokerProfile: brokerProfile?.id,
      website_slug: brokerProfile?.website_slug
    });

    if (!property) {
      console.error('Property não encontrada');
      return;
    }

    // Abrir modal de cadastro de lead
    setShowLeadModal(true);
  };

  const handleLeadSuccess = async (leadData: any) => {
    console.log('Lead cadastrado com sucesso:', leadData);
    
    // Track property interest for pixels
    trackPropertyInterest({
      property_id: property?.id || '',
      title: property?.title || '',
      price: property?.price || 0,
      contact_method: 'form'
    });

    toast({
      title: "Interesse registrado!",
      description: "Nossa equipe entrará em contato em breve.",
    });
  };

  // Fetch contact information using public RPC (no authentication required)
  const fetchContactInfo = async () => {
    if (!brokerProfile?.website_slug) {
      console.log('No broker profile or website_slug available');
      return null;
    }
    
    try {
      console.log('Fetching contact info for:', brokerProfile.website_slug);
      const { data, error } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: brokerProfile.website_slug
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

  const handleWhatsAppClick = async () => {
    console.log('handleWhatsAppClick chamada');
    
    if (!property) {
      console.error('Property não encontrada no handleWhatsAppClick');
      return;
    }

    // Fetch contact info if not already loaded
    let contactInfo = brokerContact;
    if (!contactInfo) {
      console.log('Buscando informações de contato...');
      contactInfo = await fetchContactInfo();
    }

    console.log('Contact info:', contactInfo);

    if (contactInfo?.whatsapp_number && property) {
      // Generate clean URL based on domain type
      let shareUrl: string;
      const currentOrigin = window.location.origin;
      const currentPath = window.location.pathname;
      
      // Sempre usar URL limpa baseada em slug do corretor e slug do imóvel
      const brokerSlug = brokerProfile?.website_slug || slug;
      shareUrl = `${currentOrigin}/${brokerSlug}/${property.slug}`;
      
      const message = encodeURIComponent(
        `Olá! Tenho interesse no imóvel "${property.title}" - Código: ${property.property_code || property.id.slice(-8)}. Valor: ${formatPrice(property.price)}. Gostaria de mais informações. Link: ${shareUrl}`
      );
      
      console.log('Abrindo WhatsApp e registrando lead...');
      
      // Detectar se é mobile para usar link apropriado
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const whatsappUrl = isMobile 
        ? `whatsapp://send?phone=${contactInfo.whatsapp_number}&text=${message}`
        : `https://wa.me/${contactInfo.whatsapp_number}?text=${message}`;
      
      console.log('WhatsApp URL:', whatsappUrl);
      
      // Tentar abrir WhatsApp
      try {
        window.open(whatsappUrl, '_blank');
      } catch (error) {
        console.error('Erro ao abrir WhatsApp:', error);
        // Fallback para web WhatsApp
        window.open(`https://wa.me/${contactInfo.whatsapp_number}?text=${message}`, '_blank');
      }
      
      // Registrar interesse também
      setShowLeadModal(true);
      
      // Track WhatsApp click for pixels
      trackWhatsAppClick({
        property_id: property.id,
        source: 'property_detail'
      });
    } else {
      console.error('Informações de contato não disponíveis:', { contactInfo, property });
      toast({
        title: "Informações de contato não disponíveis",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    if (!property || !brokerProfile) return;

  // Usar URL direta do site (sem Edge Function)
  const brokerSlug = brokerProfile.website_slug || slug;
  const shareUrl = `${window.location.origin}/${brokerSlug}/${property.slug}`;

    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Confira este imóvel: ${property.title}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link do imóvel foi copiado para a área de transferência."
      });
    }
  };

  const handleFavorite = () => {
    if (!property) return;

    const favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
    const isFavorited = favorites.includes(property.id);
    
    if (isFavorited) {
      const newFavorites = favorites.filter((id: string) => id !== property.id);
      localStorage.setItem('favoriteProperties', JSON.stringify(newFavorites));
      toast({
        title: "Removido dos favoritos",
        description: "O imóvel foi removido da sua lista de favoritos."
      });
    } else {
      favorites.push(property.id);
      localStorage.setItem('favoriteProperties', JSON.stringify(favorites));
      toast({
        title: "Adicionado aos favoritos",
        description: "O imóvel foi adicionado à sua lista de favoritos."
      });
    }
  };

  const isFavorited = () => {
    if (!property) return false;
    const favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
    return favorites.includes(property.id);
  };

  const propertyImages = property?.images && property.images.length > 0 
    ? property.images 
    : property?.main_image_url 
      ? [property.main_image_url] 
      : [];

  // Sync carousel with thumbnails
  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentImageIndex(index);
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  }, [carouselApi]);

  // Listen to carousel changes and sync thumbnails
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const newIndex = carouselApi.selectedScrollSnap();
      setCurrentImageIndex(newIndex);
      
      // Sincronizar o carrossel de miniaturas no mobile apenas quando necessário
      if (thumbnailCarouselApi && propertyImages.length > 6) {
        // Verificar se a miniatura atual está visível (6 thumbnails por página)
        const thumbnailPage = Math.floor(newIndex / 6);
        const currentThumbnailPage = Math.floor(thumbnailCarouselApi.selectedScrollSnap() / 6);
        
        // Só sincronizar se mudou de página de thumbnails
        if (thumbnailPage !== currentThumbnailPage) {
          thumbnailCarouselApi.scrollTo(thumbnailPage * 6);
        }
      }

      // Desktop: Scroll automático das miniaturas
      const desktopThumbnailsContainer = document.querySelector('.desktop-thumbnails-container');
      if (desktopThumbnailsContainer) {
        const thumbnailButton = desktopThumbnailsContainer.querySelector(`[data-thumbnail-index="${newIndex}"]`) as HTMLElement;
        if (thumbnailButton) {
          thumbnailButton.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    };

    carouselApi.on('select', onSelect);
    onSelect();

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, thumbnailCarouselApi, propertyImages.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 animate-fade-in">
        {/* Fixed Header Skeleton */}
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-b z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <div className="flex items-center min-w-0 flex-1 space-x-4">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0 shimmer" shimmer />
                <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0 shimmer" shimmer />
                <Skeleton className="h-6 w-48 flex-shrink-0 shimmer" shimmer />
              </div>
              
              <div className="flex items-center space-x-3 flex-shrink-0">
                <Skeleton className="h-10 w-28 rounded-lg shimmer" shimmer />
                <Skeleton className="h-10 w-10 rounded-lg shimmer" shimmer />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="pt-20">
          {/* Hero Image Skeleton */}
          <div className="relative h-80 sm:h-96 lg:h-[500px] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
            <div className="absolute bottom-6 left-0 right-0">
              <div className="flex justify-center space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-12 rounded-full bg-white/40 shimmer" shimmer />
                ))}
              </div>
            </div>
          </div>

          {/* Content Container */}
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Property Info Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Title and basic info */}
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 animate-scale-in">
                  <Skeleton className="h-10 w-full max-w-2xl shimmer" shimmer />
                  <Skeleton className="h-6 w-3/4 max-w-lg shimmer" shimmer />
                  <Skeleton className="h-12 w-48 rounded-lg shimmer" shimmer />
                  
                  {/* Property features */}
                  <div className="flex flex-wrap gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
                        <Skeleton className="h-5 w-5 flex-shrink-0 shimmer" shimmer />
                        <Skeleton className="h-4 w-16 shimmer" shimmer />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 animate-scale-in">
                  <Skeleton className="h-8 w-40 shimmer" shimmer />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton 
                        key={i} 
                        className={`h-4 ${i === 4 ? 'w-2/3' : 'w-full'} shimmer`}
                        shimmer
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="bg-white rounded-2xl shadow-xl border p-8 space-y-6 animate-scale-in">
                    <Skeleton className="h-8 w-48 shimmer" shimmer />
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full rounded-lg shimmer" shimmer />
                      <Skeleton className="h-12 w-full rounded-lg shimmer" shimmer />
                      <Skeleton className="h-12 w-full rounded-lg shimmer" shimmer />
                    </div>
                    
                    {/* Broker info */}
                    <div className="pt-6 border-t space-y-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded-full flex-shrink-0 shimmer" shimmer />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-3/4 shimmer" shimmer />
                          <Skeleton className="h-4 w-1/2 shimmer" shimmer />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property || !brokerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 animate-scale-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Imóvel não encontrado</h2>
          <Button 
            onClick={() => navigate(`/${slug || ''}`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Meta tags dinâmicas para compartilhamento */}
      <Helmet>
        <title>
          {(() => {
            const base = property ? `${property.title} - ${brokerProfile?.business_name || 'Imobiliária'}` : `${brokerProfile?.business_name || 'Imobiliária'}`;
            const tpl = brokerProfile?.property_title_template?.trim();
            if (!tpl || !property) return base;
            return tpl
              .replace('{title}', property.title)
              .replace('{business_name}', brokerProfile?.business_name || 'Imobiliária');
          })()}
        </title>
        <meta 
          name="description" 
          content={(() => {
            const base = property ? `${property.description?.slice(0, 160)} - ${formatPrice(property.price)} em ${property.neighborhood}, ${property.uf}` : `Confira este imóvel em ${brokerProfile?.business_name || 'nossa imobiliária'}`;
            const tpl = brokerProfile?.property_description_template?.trim();
            if (!tpl || !property) return base;
            return tpl
              .replace('{price}', formatPrice(property.price))
              .replace('{bedrooms}', String(property.bedrooms ?? ''))
              .replace('{bathrooms}', String(property.bathrooms ?? ''))
              .replace('{area_m2}', String(property.area_m2 ?? ''))
              .replace('{neighborhood}', property.neighborhood || '')
              .replace('{uf}', property.uf || '');
          })()} 
        />
        
        {/* Open Graph para WhatsApp e redes sociais */}
        <meta 
          property="og:title" 
          content={property ? 
            `${property.title} - ${brokerProfile?.business_name || 'Imobiliária'}` : 
            `${brokerProfile?.business_name || 'Imobiliária'}`
          } 
        />
        <meta 
          property="og:description" 
          content={property ? 
            `${formatPrice(property.price)} • ${property.bedrooms} quartos • ${property.bathrooms} banheiros • ${property.area_m2}m² em ${property.neighborhood}, ${property.uf}` :
            `Confira este imóvel em ${brokerProfile?.business_name || 'nossa imobiliária'}`
          } 
        />
        <meta 
          property="og:image" 
          content={property?.main_image_url ? 
            (property.main_image_url.startsWith('http') ? property.main_image_url : `${window.location.origin}${property.main_image_url}`) :
            brokerProfile?.logo_url ? 
              (brokerProfile.logo_url.startsWith('http') ? brokerProfile.logo_url : `${window.location.origin}${brokerProfile.logo_url}`) :
              `${window.location.origin}/placeholder.svg`
          } 
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:type" content="website" />
  <meta property="og:site_name" content={brokerProfile?.business_name || 'Imobiliária'} />
        <meta property="og:url" content={window.location.href} />
        <meta name="robots" content={`${(brokerProfile?.robots_index ?? true) ? 'index' : 'noindex'}, ${(brokerProfile?.robots_follow ?? true) ? 'follow' : 'nofollow'}`} />
        <link rel="canonical" href={(() => {
          const preferCustom = brokerProfile?.canonical_prefer_custom_domain ?? true;
          const useCustom = preferCustom && brokerProfile?.custom_domain;
          if (useCustom) {
            return `https://${brokerProfile!.custom_domain!}/${property?.slug}`;
          }
          return `${window.location.origin}/${brokerProfile?.website_slug}/${property?.slug}`;
        })()} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta 
          name="twitter:title" 
          content={property ? 
            `${property.title} - ${brokerProfile?.business_name || 'Imobiliária'}` : 
            `${brokerProfile?.business_name || 'Imobiliária'}`
          } 
        />
        <meta 
          name="twitter:description" 
          content={property ? 
            `${formatPrice(property.price)} • ${property.bedrooms} quartos • ${property.bathrooms} banheiros • ${property.area_m2}m²` :
            `Confira este imóvel em ${brokerProfile?.business_name || 'nossa imobiliária'}`
          } 
        />
        <meta 
          name="twitter:image" 
          content={property?.main_image_url ? 
            (property.main_image_url.startsWith('http') ? property.main_image_url : `${window.location.origin}${property.main_image_url}`) :
            brokerProfile?.logo_url ? 
              (brokerProfile.logo_url.startsWith('http') ? brokerProfile.logo_url : `${window.location.origin}${brokerProfile.logo_url}`) :
              `${window.location.origin}/placeholder.svg`
          } 
        />
        
        {/* WhatsApp específico */}
        <meta property="whatsapp:image" 
          content={property?.main_image_url ? 
            (property.main_image_url.startsWith('http') ? property.main_image_url : `${window.location.origin}${property.main_image_url}`) :
            `${window.location.origin}/placeholder.svg`
          } 
        />

        {/* JSON-LD Structured Data: Product/Offer for real estate */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: property?.title,
            description: property?.description?.slice(0, 160),
            image: property?.main_image_url
              ? (property.main_image_url.startsWith('http') ? property.main_image_url : `${window.location.origin}${property.main_image_url}`)
              : undefined,
            sku: property?.property_code || property?.id,
            brand: {
              '@type': 'Organization',
              name: brokerProfile?.business_name || 'Imobiliária'
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              price: property?.price,
              availability: 'https://schema.org/InStock',
              url: window.location.href
            }
          })}
        </script>
      </Helmet>

      {/* Container principal do conteúdo da propriedade */}
      <div className="min-h-screen bg-gray-50 animate-fade-in">
        {/* Header Premium - Melhorado com gradiente e blur */}
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
              <div className="flex items-center min-w-0 flex-1 space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="hover:bg-gray-100 p-2 sm:p-3 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline font-medium text-sm">Voltar</span>
                </Button>
                
                <button
                  onClick={() => navigate(`/${brokerProfile?.website_slug || slug}`)}
                  className="flex items-center hover:opacity-80 transition-opacity min-w-0 flex-1"
                >
                  {brokerProfile.logo_url ? (
                    <img 
                      src={brokerProfile.logo_url} 
                      alt={brokerProfile.business_name} 
                      className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 flex-shrink-0 rounded-lg object-contain" 
                    />
                  ) : (
                    <div 
                      className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 rounded-lg text-white flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0"
                      style={{ backgroundColor: brokerProfile.primary_color || '#374151' }}
                    >
                      {brokerProfile.business_name?.charAt(0) || 'I'}
                    </div>
                  )}
                  <span className="ml-2 sm:ml-3 text-sm sm:text-lg md:text-2xl font-semibold text-gray-900 truncate">
                    {brokerProfile.business_name}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShare}
                  className="hover:bg-gray-50 border-gray-300 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm"
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </Button>
                
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  className={`p-2 sm:p-3 rounded-lg transition-colors ${
                    isFavorited() 
                      ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorited() ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="pt-16 sm:pt-18 md:pt-24 pb-4">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <nav className="flex text-xs sm:text-sm text-gray-600 bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm">
              <button onClick={() => navigate(`/${slug}`)} className="hover:text-gray-900 cursor-pointer font-medium transition-colors">
                Início
              </button>
              <span className="mx-2 sm:mx-3 text-gray-400">/</span>
              <span className="text-gray-900 truncate font-medium">
                Código {property.property_code || property.id.slice(-8)}
              </span>
            </nav>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Gallery Column - 3 colunas */}
            <div className="lg:col-span-3">
              {/* Galeria de Imagens Mobile */}
              {propertyImages.length > 0 ? (
                <div className="lg:hidden mb-8 relative">
                  <Carousel 
                    className="w-full" 
                    setApi={setCarouselApi}
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                  >
                    <CarouselContent>
                      {propertyImages.map((image, index) => (
                        <CarouselItem key={index}>
                           <div className="relative h-80 sm:h-96 bg-gray-100 overflow-hidden">
                             <img
                               src={image}
                               alt={`${property.title} - Imagem ${index + 1}`}
                               className="w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
                               onClick={() => {setCurrentImageIndex(index); setIsImageModalOpen(true);}}
                               loading={index === 0 ? "eager" : "lazy"}
                             />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    
                    {propertyImages.length > 1 && (
                      <>
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 border-0 hover:bg-white z-20" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 border-0 hover:bg-white z-20" />
                      </>
                    )}
                  </Carousel>
                  
                  {/* Fixed UI elements for mobile */}
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium z-30">
                    {currentImageIndex + 1} / {propertyImages.length}
                  </div>
                  
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="absolute bottom-4 right-4 bg-white/90 text-gray-800 p-2 rounded-lg hover:bg-white transition-colors z-30"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  
                  <div className="absolute top-4 left-4 z-30">
                    <Badge className="bg-white text-gray-900 hover:bg-white px-3 py-1 text-sm">
                      <Eye className="h-3 w-3 mr-1" />
                      {viewsCount} visualizações
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-80 sm:h-96 bg-gray-200 flex items-center justify-center lg:hidden mb-8">
                  <p className="text-gray-500 font-medium">Nenhuma imagem disponível</p>
                </div>
              )}

              {/* Desktop Gallery */}
              <div className="hidden lg:block mb-8">
                {propertyImages.length > 0 ? (
                  <div className="relative h-[500px] rounded-lg overflow-hidden shadow-lg bg-gray-100">
                    <img
                      src={propertyImages[currentImageIndex]}
                      alt={`${property.title} - Imagem ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain transition-all duration-300"
                      loading="eager"
                    />
                    
                    <div className="absolute top-6 right-6 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      {currentImageIndex + 1} / {propertyImages.length}
                    </div>
                    
                    <button
                      onClick={() => setIsImageModalOpen(true)}
                      className="absolute bottom-6 right-6 bg-white/90 text-gray-800 p-3 rounded-lg hover:bg-white transition-colors"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
                    
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-white text-gray-900 hover:bg-white px-4 py-2 text-sm font-medium">
                        <Eye className="h-4 w-4 mr-2" />
                        {viewsCount} visualizações
                      </Badge>
                    </div>

                    {/* Navigation Arrows */}
                    {propertyImages.length > 1 && (
                      <>
                        <button
                          onClick={() => handleThumbnailClick(currentImageIndex > 0 ? currentImageIndex - 1 : propertyImages.length - 1)}
                          className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-3 rounded-lg hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleThumbnailClick(currentImageIndex < propertyImages.length - 1 ? currentImageIndex + 1 : 0)}
                          className="absolute right-20 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-3 rounded-lg hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5 rotate-180" />
                        </button>
                      </>
                    )}

                    {/* Desktop Thumbnails */}
                    {propertyImages.length > 1 && (
                      <div className="absolute bottom-6 left-6 right-20">
                        <div className="desktop-thumbnails-container flex space-x-2 overflow-x-auto scrollbar-hide">
                          {propertyImages.map((image, index) => (
                            <button
                              key={index}
                              data-thumbnail-index={index}
                              onClick={() => handleThumbnailClick(index)}
                              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                                index === currentImageIndex 
                                  ? 'border-white shadow-lg' 
                                  : 'border-white/50 hover:border-white/75'
                              }`}
                            >
                              <img
                                src={image}
                                alt={`Miniatura ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[500px] bg-gray-200 flex items-center justify-center rounded-lg shadow-lg">
                    <p className="text-gray-500 text-lg font-medium">Nenhuma imagem disponível</p>
                  </div>
                )}
              </div>

              {/* Property Info Section */}
              <div className="space-y-6">
                {/* Title and Price Card (refinado) */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight tracking-tight">
                        {property.title}
                      </h1>
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-base">{property.neighborhood}, {property.uf}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div className="inline-flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                            {formatPrice(property.price)}
                          </span>
                          {property.transaction_type === 'rent' && (
                            <span className="text-gray-500 text-sm">/ mês</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <FeeBadge label="Condomínio" amount={property.hoa_fee as any} periodicity={property.hoa_periodicity as any} />
                          <FeeBadge label="IPTU" amount={property.iptu_value as any} periodicity={property.iptu_periodicity as any} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Property Features - Compact single line */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-6">
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                        <Bed className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-sm sm:text-lg font-semibold text-gray-900">{property.bedrooms}</div>
                        <div className="text-sm sm:text-sm text-gray-600 font-medium">Quartos</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                        <Bath className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-sm sm:text-lg font-semibold text-gray-900">{property.bathrooms}</div>
                        <div className="text-sm sm:text-sm text-gray-600 font-medium">Banheiros</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                        <Square className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-sm sm:text-lg font-semibold text-gray-900">{property.area_m2}</div>
                        <div className="text-sm sm:text-sm text-gray-600 font-medium">m²</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                        <Car className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-sm sm:text-lg font-semibold text-gray-900">{property.parking_spaces}</div>
                        <div className="text-sm sm:text-sm text-gray-600 font-medium">Vagas</div>
                      </div>
                    </div>

                    {/* Type and Transaction Badges */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      <Badge className="bg-gray-100 text-gray-800 px-3 py-1 text-sm border border-gray-300">
                        {property.property_type}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-800 px-3 py-1 text-sm border border-gray-300">
                        {property.transaction_type}
                      </Badge>
                      {property.is_featured && (
                        <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm border border-blue-300">
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>


                {/* Faixa azul com tabs (Detalhes / Características) */}
                <div className="rounded-2xl border border-blue-100 overflow-hidden">
                  <div className="bg-blue-50">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                      {/* Tabs laterais */}
                      <div className="flex lg:flex-col gap-2 p-2 sm:p-3 lg:p-4">
                        {['Detalhes', 'Características'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'Detalhes' | 'Características')}
                            className={`text-sm sm:text-base font-semibold rounded-xl px-4 py-2 border transition-colors w-full lg:w-auto lg:px-5 lg:py-3 ${activeTab === tab ? 'bg-white border-white text-gray-900 shadow-sm' : 'bg-blue-100/40 border-blue-100 text-blue-800 hover:bg-blue-100'}`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      {/* Conteúdo da aba */}
                      <div className="lg:col-span-2 bg-white p-4 sm:p-6">
                        {activeTab === 'Detalhes' && (
                          <div className="space-y-6">
                            {/* Descrição */}
                            <div>
                              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                                Descrição do Imóvel
                              </h2>
                              <div className="prose max-w-none text-gray-700">
                                {property.description ? (
                                  <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{property.description}</p>
                                ) : (
                                  <p className="text-gray-500 italic text-sm sm:text-base">Nenhuma descrição disponível.</p>
                                )}
                              </div>
                            </div>

                            {/* Informações gerais (já renderizadas acima quando houver) - aqui mantemos para proximidade conceitual */}
                            {(property.private_area_m2 || property.total_area_m2 || property.suites || property.covered_parking_spaces || property.floor_number || property.total_floors || property.built_year || property.sunlight_orientation || property.property_condition || property.water_cost || property.electricity_cost || property.furnished || property.accepts_pets || property.elevator || property.portaria_24h || property.gas_included || property.accessibility || property.heating_type) && (
                              <div>
                                {/* Resumo das informações gerais sem título (integrad0 à aba Detalhes) */}
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'Características' && (
                          <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                              Características
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {/* Itens vindos de features (texto livre) */}
                              {property.features && property.features.length > 0 && property.features.map((feature, index) => (
                                <div key={`feat-${index}`} className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                                  <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                                </div>
                              ))}

                              {/* Itens estruturados (antes "Informações gerais") */}
                              {property.private_area_m2 && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Área útil</div>
                                  <div className="text-gray-900 font-semibold">{property.private_area_m2} m²</div>
                                </div>
                              )}
                              {property.total_area_m2 && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Área total</div>
                                  <div className="text-gray-900 font-semibold">{property.total_area_m2} m²</div>
                                </div>
                              )}
                              {property.suites != null && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Suítes</div>
                                  <div className="text-gray-900 font-semibold">{property.suites}</div>
                                </div>
                              )}
                              {property.covered_parking_spaces != null && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Vagas cobertas</div>
                                  <div className="text-gray-900 font-semibold">{property.covered_parking_spaces}</div>
                                </div>
                              )}
                              {property.floor_number != null && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Andar</div>
                                  <div className="text-gray-900 font-semibold">{property.floor_number}</div>
                                </div>
                              )}
                              {property.total_floors != null && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Total de andares</div>
                                  <div className="text-gray-900 font-semibold">{property.total_floors}</div>
                                </div>
                              )}
                              {property.built_year && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Ano de construção</div>
                                  <div className="text-gray-900 font-semibold">{property.built_year}</div>
                                </div>
                              )}
                              {property.sunlight_orientation && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Face do sol</div>
                                  <div className="text-gray-900 font-semibold">{property.sunlight_orientation}</div>
                                </div>
                              )}
                              {property.property_condition && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Condição</div>
                                  <div className="text-gray-900 font-semibold">{property.property_condition}</div>
                                </div>
                              )}
                              {property.water_cost != null && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Água</div>
                                  <div className="text-gray-900 font-semibold">{formatPrice(property.water_cost as any)}</div>
                                </div>
                              )}
                              {property.electricity_cost != null && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Luz</div>
                                  <div className="text-gray-900 font-semibold">{formatPrice(property.electricity_cost as any)}</div>
                                </div>
                              )}
                              {typeof property.furnished === 'boolean' && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Mobiliado</div>
                                  <div className="text-gray-900 font-semibold">{property.furnished ? 'Sim' : 'Não'}</div>
                                </div>
                              )}
                              {typeof property.accepts_pets === 'boolean' && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Aceita pets</div>
                                  <div className="text-gray-900 font-semibold">{property.accepts_pets ? 'Sim' : 'Não'}</div>
                                </div>
                              )}
                              {typeof property.elevator === 'boolean' && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Elevador</div>
                                  <div className="text-gray-900 font-semibold">{property.elevator ? 'Sim' : 'Não'}</div>
                                </div>
                              )}
                              {typeof property.portaria_24h === 'boolean' && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Portaria 24h</div>
                                  <div className="text-gray-900 font-semibold">{property.portaria_24h ? 'Sim' : 'Não'}</div>
                                </div>
                              )}
                              {typeof property.gas_included === 'boolean' && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Gás encanado incluso</div>
                                  <div className="text-gray-900 font-semibold">{property.gas_included ? 'Sim' : 'Não'}</div>
                                </div>
                              )}
                              {typeof property.accessibility === 'boolean' && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Acessibilidade</div>
                                  <div className="text-gray-900 font-semibold">{property.accessibility ? 'Sim' : 'Não'}</div>
                                </div>
                              )}
                              {property.heating_type && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <div className="text-xs text-gray-500">Aquecimento</div>
                                  <div className="text-gray-900 font-semibold">{property.heating_type}</div>
                                </div>
                              )}
                              {property.notes && (
                                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 lg:col-span-3">
                                  <div className="text-xs text-gray-500 mb-1">Observações</div>
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{property.notes}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Card */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    Localização
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{property.address}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                      <p className="text-gray-600 text-center text-sm sm:text-base">
                        Mapa da localização em breve
                      </p>
                    </div>
                  </div>
                </div>

                {/* Similar Properties */}
                {similarProperties.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                      Imóveis Similares
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {similarProperties.slice(0, 4).map((similar) => (
                        <div
                          key={similar.id}
                          onClick={() => navigate(`/${slug}/${similar.slug}`)}
                          className="bg-gray-50 rounded-lg p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                        >
                          <div className="aspect-video bg-gray-200 rounded-lg mb-2 sm:mb-3 overflow-hidden">
                            {similar.main_image_url ? (
                              <img
                                src={similar.main_image_url}
                                alt={similar.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Square className="h-6 w-6 sm:h-8 sm:w-8" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 text-sm sm:text-base">{similar.title}</h3>
                          <div className="text-gray-900 font-semibold text-base sm:text-lg mb-0.5">
                            {formatPrice(similar.price)}
                          </div>
                          {typeof (similar as any).hoa_fee === 'number' && (similar as any).hoa_fee > 0 && (
                            <div className="text-[11px] sm:text-xs text-gray-600 mb-1">
                              Condomínio {formatPrice((similar as any).hoa_fee)}
                              {((similar as any).hoa_periodicity === 'monthly') && ' / mês'}
                              {((similar as any).hoa_periodicity === 'annual') && ' / ano'}
                            </div>
                          )}
                          <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{similar.neighborhood}, {similar.uf}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Sidebar - 1 coluna */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 sm:top-24">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Interessado?</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Entre em contato conosco</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleWhatsAppClick}
                      className="w-full py-2 sm:py-3 text-sm sm:text-base font-medium text-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      style={{ 
                        backgroundColor: brokerProfile?.whatsapp_button_color || '#25D366'
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.69"/>
                      </svg>
                      {brokerProfile?.whatsapp_button_text || 'WhatsApp'}
                    </Button>
                    
                    <Button 
                      onClick={handleContactLead}
                      variant="outline"
                      className="w-full py-2 sm:py-3 text-sm sm:text-base font-medium border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg"
                    >
                      Tenho Interesse
                    </Button>
                    
                    <Button 
                      onClick={handleShare}
                      variant="outline"
                      className="w-full py-2 sm:py-3 text-sm sm:text-base font-medium border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                  
                  {/* Broker/Realtor Info */}
                  {(property.realtor_name || brokerProfile?.display_name) && (
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {property.realtor_avatar_url ? (
                            <img
                              src={property.realtor_avatar_url}
                              alt={property.realtor_name || brokerProfile?.display_name || 'Corretor'}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div 
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center text-white font-semibold text-sm sm:text-base"
                              style={{ backgroundColor: brokerProfile?.primary_color || '#374151' }}
                            >
                              {(property.realtor_name || brokerProfile?.display_name || 'C')?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {property.realtor_name || brokerProfile?.display_name}
                          </h4>
                          {property.realtor_creci && (
                            <p className="text-xs sm:text-sm text-gray-600">
                              CRECI: {property.realtor_creci}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-500">
                            Corretor
                          </p>
                        </div>
                      </div>
                      
                      {property.realtor_bio && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs sm:text-sm text-gray-700">
                            {property.realtor_bio}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Property Stats */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-base sm:text-lg font-semibold text-gray-900">{viewsCount}</div>
                        <div className="text-xs text-gray-600">Visualizações</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-base sm:text-lg font-semibold text-gray-900">Online</div>
                        <div className="text-xs text-gray-600">Disponível</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto p-0 bg-black/95 border-0 flex items-center justify-center">
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 z-10 bg-white/20 text-white p-2 rounded-lg hover:bg-white/30"
              >
                <X className="h-6 w-6" />
              </button>
              
               {propertyImages.length > 0 && (
                <div className="w-[95vw] h-[90vh] md:max-w-[90vw] md:max-h-[85vh] flex items-center justify-center">
                  <ZoomableImage
                    src={propertyImages[currentImageIndex]}
                    alt={`${property.title} - Imagem ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              {propertyImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : propertyImages.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-lg hover:bg-white/30"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex < propertyImages.length - 1 ? currentImageIndex + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-lg hover:bg-white/30"
                  >
                    <ChevronLeft className="h-6 w-6 rotate-180" />
                  </button>
                </>
              )}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-lg">
                {currentImageIndex + 1} de {propertyImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Realtor Card */}
      {isMobile && property.realtor_name && (
        <MobileRealtorCard 
          property={property}
          brokerProfile={brokerProfile}
          onWhatsAppClick={handleWhatsAppClick}
        />
      )}

      {/* Contact CTA */}
      <ContactCTA 
        brokerProfile={brokerProfile}
      />

      {/* Footer */}
      <Footer 
        brokerProfile={brokerProfile} 
        onContactRequest={fetchContactInfo}
      />

      {/* Lead Modal */}
      <LeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleLeadSuccess}
        property={property}
        brokerProfile={brokerProfile}
      />
    </>
  );
};

export default PropertyDetailPage;