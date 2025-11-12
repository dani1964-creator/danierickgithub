import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ChevronLeft, MapPin, Bed, Bath, Car, Square, Eye, Heart, Share2, MessageCircle, Phone, Mail, X, Play, Maximize2, ArrowLeft, Star, Calendar, Users, Zap, Moon, Sun } from 'lucide-react';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { SafeImage } from '@/components/ui/SafeImage';
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
import { useDomainAware } from '@/hooks/useDomainAware';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { FloatingFavoritesButton } from '@/components/FavoritesButton';
import ContactCTA from '@/components/home/ContactCTA';
import Footer from '@/components/home/Footer';
import LeadModal from '@/components/leads/LeadModal';
import { getErrorMessage } from '@/lib/utils';
import { getPublicUrl } from '@/lib/seo';
import { logger } from '@/lib/logger';
import { getPrefetchedDetail, setPrefetchedDetail } from '@/lib/detail-prefetch';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  transaction_type: string;
  address: string;
  neighborhood: string;
  city?: string;
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

import type { BrokerProfile, BrokerContact } from '@/shared/types/broker';

const PropertyDetailPage = () => {
  const router = useRouter();
  const { slug, propertySlug: propertySlugParam } = router.query as { slug?: string; propertySlug?: string };
  const { toast } = useToast();
  const { showSuccess, showError } = useNotifications();
  const { favorites, toggleFavorite, isFavorited } = useFavorites();
  
  // Refs para evitar dependências desnecessárias no useCallback
  const toastRef = useRef(toast);
  
  // Atualizar refs quando funções mudarem
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const { trackPropertyView, trackPropertyInterest, trackWhatsAppClick } = useTracking();
  const isMobile = useIsMobile();
  const [property, setProperty] = useState<Property | null>(null);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);
  const [brokerContact, setBrokerContact] = useState<BrokerContact | null>(null);
  const [socialLinks, setSocialLinks] = useState<Array<{ id: string; platform: string; url: string }>>([]);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [thumbnailCarouselApi, setThumbnailCarouselApi] = useState<CarouselApi>();
  const [activeTab, setActiveTab] = useState<'Detalhes' | 'Características'>('Detalhes');
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('property-detail-dark-mode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  
  // Aplicar classe dark ao documento quando isDarkMode mudar
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  const { getBrokerByDomainOrSlug, isCustomDomain } = useDomainAware();

  // Para domínios customizados, a rota é /:propertySlug (sem broker slug). Tratar isso aqui.
  const effectivePropertySlug = propertySlugParam || (isCustomDomain() ? slug : undefined);
  
  // Tentar obter o broker slug de várias fontes
  const getBrokerSlug = useCallback(async (): Promise<string | undefined> => {
    // 1. Se já temos na query, usar
    if (slug) return slug as string;
    
    // 2. Tentar extrair do hostname (subdomínio)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';
      
      // Se for subdomínio, extrair slug
      if (hostname.endsWith(`.${baseDomain}`) && hostname !== baseDomain) {
        const extractedSlug = hostname.split(`.${baseDomain}`)[0];
        logger.debug('Extracted broker slug from hostname:', extractedSlug);
        return extractedSlug;
      }
    }
    
    // 3. Se for domínio customizado, buscar via API
    if (isCustomDomain()) {
      logger.debug('Custom domain detected, fetching broker data...');
      const broker = await getBrokerByDomainOrSlug(undefined);
      if (broker) {
        const brokerSlug = (broker as unknown as { website_slug?: string })?.website_slug;
        logger.debug('Broker slug found via API:', brokerSlug);
        return brokerSlug;
      }
    }
    
    return undefined;
  }, [slug, isCustomDomain, getBrokerByDomainOrSlug]);

  const fetchPropertyData = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      logger.debug('🏠 Fetching property data...', { 
        propertySlug: effectivePropertySlug, 
        slug, 
        retryCount 
      });
      
      // Teste básico de conectividade
      try {
        const { error: pingError } = await supabase
          .from('properties')
          .select('id')
          .limit(1);
          
        if (pingError) {
          logger.warn('Connectivity test warning:', pingError);
        }
      } catch (connectError) {
        logger.error('Connection test failed:', connectError);
        if (retryCount < 2) {
          logger.info(`Retrying connection... (${retryCount + 1}/3)`);
          setTimeout(() => fetchPropertyData(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        throw new Error('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
      }
      // Descobrir o slug do broker
      const effectiveSlug = await getBrokerSlug();
      
      if (!effectivePropertySlug || !effectiveSlug) {
        logger.error('Missing parameters:', { effectivePropertySlug, effectiveSlug });
        throw new Error('Parâmetros insuficientes para carregar o imóvel.');
      }
      
      // Tenta hidratar com dados pré-carregados (se existirem)
      const cached = getPrefetchedDetail(effectiveSlug, effectivePropertySlug);
      if (cached) {
        // Hidrata a partir do cache sem capturar state no fechamento do hook
        setProperty((prev) => prev ?? (cached.property as unknown as typeof prev));
        setBrokerProfile((prev) => prev ?? (cached.brokerProfile as unknown as BrokerProfile));
        setLoading(false); // render imediato
      }

      // Executa consultas em paralelo para reduzir TTFB
      logger.debug('Calling RPC functions with params:', { 
        broker_slug: effectiveSlug, 
        property_slug: effectivePropertySlug 
      });
      
      const [propertyResult, brokerResult] = await Promise.all([
        supabase.rpc('get_public_property_detail_with_realtor', {
          broker_slug: effectiveSlug,
          property_slug: effectivePropertySlug
        }),
        supabase.rpc('get_public_broker_branding', { 
          broker_website_slug: effectiveSlug 
        })
      ]);
      
  logger.debug('Property RPC result:', propertyResult);
  logger.debug('Broker RPC result:', brokerResult);

      const { data: propertyDataArray, error: propertyError } = propertyResult;
      const { data: brokerDataArray, error: brokerError } = brokerResult;

  logger.debug('Property data from RPC:', propertyDataArray);
  logger.debug('Broker data from RPC:', brokerDataArray);

      if (propertyError) {
  logger.error('Property RPC error:', propertyError);
        // Fallback: tentar consulta direta se RPC falhar
  logger.info('Attempting fallback query for property...');
        
        const fallbackProperty = await supabase
          .from('properties')
          .select(`
            *,
            brokers!inner(
              business_name,
              display_name,
              website_slug
            )
          `)
          .eq('slug', effectivePropertySlug)
          .eq('brokers.website_slug', effectiveSlug)
          .eq('is_active', true)
          .single();
          
        if (fallbackProperty.error) {
          logger.error('Fallback property query failed:', fallbackProperty.error);
          throw new Error(`Erro ao carregar propriedade: ${fallbackProperty.error.message}`);
        }
        
  logger.debug('Fallback property data:', fallbackProperty.data);
      }

      if (brokerError) {
        logger.error('Broker RPC error:', brokerError);
        throw new Error(`Erro ao carregar dados do corretor: ${brokerError.message}`);
      }

      if (!propertyDataArray || propertyDataArray.length === 0) {
        logger.error('No property data returned from RPC');
        throw new Error('Propriedade não encontrada');
      }

      const propertyData = propertyDataArray[0];
  logger.debug('Property data:', propertyData);

  logger.debug('Broker data array:', brokerDataArray);
      const brokerData = brokerDataArray?.[0];
  logger.debug('Broker data:', brokerData);

      if (brokerError) {
        logger.error('Broker error:', brokerError);
        throw brokerError;
      }

      if (!brokerData) {
        throw new Error('Corretor não encontrado');
      }

      // Fetch similar properties (não bloqueia render principal)
      const similarPromise = supabase
        .from('properties')
        .select('*, slug')
        .eq('is_active', true)
        .eq('property_type', propertyData.property_type)
        .eq('transaction_type', propertyData.transaction_type)
        .eq('broker_id', brokerData.id)
        .neq('id', propertyData.id)
        .limit(6);

  const { data: similarData, error: similarError } = await similarPromise;
  if (similarError) logger.warn('Similar properties error:', similarError);

      // Fetch social links (não bloqueia render principal)
      const { data: socialData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('broker_id', brokerData.id)
        .eq('is_active', true);

      if (socialError) {
        logger.warn('Error fetching social links:', socialError);
      }

      logger.debug('Realtor data from RPC:', {
        realtor_name: propertyData.realtor_name,
        realtor_avatar_url: propertyData.realtor_avatar_url,
        realtor_creci: propertyData.realtor_creci
      });

      setProperty(propertyData);
      setBrokerProfile(brokerData as unknown as BrokerProfile);
      // Atualiza cache de prefetch para navegações futuras
      setPrefetchedDetail(effectiveSlug, effectivePropertySlug, {
        property: propertyData,
        brokerProfile: brokerData as unknown as BrokerProfile,
      });
      setSimilarProperties(similarData || []);
      setSocialLinks(socialData || []);
      setViewsCount(propertyData.views_count || 0);

      // Atualiza contador de views sem bloquear a UI
      const updatedViews = (propertyData.views_count || 0) + 1;
      setViewsCount(updatedViews);
      (async () => {
        try {
          const { error: updateError } = await supabase
            .from('properties')
            .update({ views_count: updatedViews })
            .eq('id', propertyData.id);
          if (updateError) logger.warn('views_count update error:', updateError.message || updateError);
          } catch (e) {
          logger.warn('views_count update failed:', e);
        }
      })();

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

    } catch (error: unknown) {
      logger.error('Error loading property:', error);
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = '';
      let shouldRetry = false;
      
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
        shouldRetry = true;
      } else if (error instanceof Error) {
        if (error.message.includes('TypeError: Failed to fetch')) {
          errorMessage = 'Erro de conexão com o servidor. Tentando novamente...';
          shouldRetry = true;
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = getErrorMessage(error);
      }
      
      setError(errorMessage);
      
      // Se for erro de conexão, tentar novamente automaticamente após 2 segundos
        if (shouldRetry) {
        toast({
          title: "Problema de conexão",
          description: "Tentando reconectar automaticamente...",
          variant: "destructive"
        });
        
        setTimeout(() => {
          logger.info('Auto-retrying after connection error...');
          fetchPropertyData(0);
        }, 2000);
      } else {
        toast({
          title: "Erro ao carregar imóvel",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
        // Não navegar imediatamente - dar opção ao usuário
      logger.info('Error occurred, showing error state instead of navigating');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePropertySlug, slug]);

  useEffect(() => {
    if (effectivePropertySlug) {
      fetchPropertyData();
    }
  }, [effectivePropertySlug, fetchPropertyData]);

  // Fallback de carregamento já existente mais abaixo

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
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-700'} text-xs sm:text-sm transition-colors duration-300`}>
        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{label}:</span>
        <span>{formatPrice(amount)}</span>
        {periodicity && (
          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>/ {getPeriodicityLabel(periodicity)}</span>
        )}
      </span>
    );
  };

  const handleContactLead = async () => {
    logger.debug('handleContactLead chamada - Dados:', {
      property: property?.id,
      brokerProfile: brokerProfile?.id,
      website_slug: brokerProfile?.website_slug
    });

    if (!property) {
      logger.error('Property não encontrada');
      return;
    }

    // Abrir modal de cadastro de lead
    setShowLeadModal(true);
  };

  const handleLeadSuccess = async (leadData: unknown) => {
    logger.info('Lead cadastrado com sucesso:', leadData);
    
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
      logger.warn('No broker profile or website_slug available');
      return null;
    }
    
    try {
      logger.debug('Fetching contact info for:', brokerProfile.website_slug);
      const { data, error } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: brokerProfile.website_slug
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
    } catch (error) {
      logger.error('Error fetching contact info:', error);
      return null;
    }
  };

  const handleWhatsAppClick = async () => {
    logger.debug('handleWhatsAppClick chamada');
    
    if (!property) {
      logger.error('Property não encontrada no handleWhatsAppClick');
      return;
    }

    // Fetch contact info if not already loaded
    let contactInfo = brokerContact;
    if (!contactInfo) {
      logger.debug('Buscando informações de contato...');
      contactInfo = await fetchContactInfo();
    }

    logger.debug('Contact info:', contactInfo);

    if (contactInfo?.whatsapp_number && property) {
    // Generate clean URL based on domain type
      const currentOrigin = window.location.origin;
      const currentPath = router.pathname;
      
      // Sempre usar URL limpa baseada em slug do corretor e slug do imóvel
      const brokerSlug = brokerProfile?.website_slug || slug;
      const shareUrl = getPublicUrl(brokerSlug as string, property.slug as string);
      
      const message = encodeURIComponent(
        `Olá! Tenho interesse no imóvel "${property.title}" - Código: ${property.property_code || property.id.slice(-8)}. Valor: ${formatPrice(property.price)}. Gostaria de mais informações. Link: ${shareUrl}`
      );
      
  logger.info('Abrindo WhatsApp e registrando lead...');
      
      // Detectar se é mobile para usar link apropriado
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const whatsappUrl = isMobile 
        ? `whatsapp://send?phone=${contactInfo.whatsapp_number}&text=${message}`
        : `https://wa.me/${contactInfo.whatsapp_number}?text=${message}`;
      
  logger.debug('WhatsApp URL:', whatsappUrl);
      
      // Abrir WhatsApp
      try {
        window.open(whatsappUrl, '_blank');
      } catch (error) {
        logger.error('Erro ao abrir WhatsApp:', error);
        // Fallback para link direto
        window.location.href = whatsappUrl;
      }
      
      // Registrar interesse também
      setShowLeadModal(true);
      
      // Track WhatsApp click for pixels
      trackWhatsAppClick({
        property_id: property.id,
        source: 'property_detail'
      });
    } else {
      logger.error('Informações de contato não disponíveis:', { contactInfo, property });
      toast({
        title: "Informações de contato não disponíveis",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    if (!property || !brokerProfile) return;
    // Usar URL direta do site (via helper centralizado)
    const brokerSlug = brokerProfile.website_slug || slug;
    const shareUrl = getPublicUrl(brokerSlug as string, property.slug as string);

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

    // Obtém broker slug do brokerProfile ou da URL
    const brokerSlug = brokerProfile?.website_slug || slug;
    if (!brokerSlug) {
      showError('Erro ao favoritar', 'Não foi possível identificar a imobiliária.');
      return;
    }

    toggleFavorite({
      id: property.id,
      title: property.title,
      slug: property.slug || '',
      price: property.price,
      main_image_url: property.main_image_url || property.images?.[0] || '',
      broker_slug: String(brokerSlug),
      property_type: property.property_type || '',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area_m2: property.area_m2,
      city: property.city || '',
      uf: property.uf || '',
    });

    if (isFavorited(property.id)) {
      showSuccess('Removido dos favoritos', 'O imóvel foi removido da sua lista.');
    } else {
      showSuccess('Adicionado aos favoritos', 'O imóvel foi salvo na sua lista.');
    }
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

  // Função para alternar modo escuro
  const toggleDarkMode = useCallback(() => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('property-detail-dark-mode', JSON.stringify(newMode));
    
    // Aplicar classe dark ao documento
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handler para erro de imagem
  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
    logger.warn(`Failed to load image at index ${index}`);
  }, []);

  // Função de debug para testar RPC
  const testRPCFunctions = useCallback(async () => {
    logger.debug('Testing RPC functions...');
    try {
      const testSlug = slug || 'test-broker';
      const testPropertySlug = effectivePropertySlug || 'test-property';
      
      logger.debug('Testing with params:', { testSlug, testPropertySlug });
      
      // Test property RPC
      logger.debug('Testing get_public_property_detail_with_realtor...');
      const propertyTest = await supabase.rpc('get_public_property_detail_with_realtor', {
        broker_slug: testSlug,
        property_slug: testPropertySlug
      });
      logger.debug('Property RPC test result:', propertyTest);
      
      // Test broker RPC
      logger.debug('Testing get_public_broker_branding...');
      const brokerTest = await supabase.rpc('get_public_broker_branding', {
        broker_website_slug: testSlug
      });
      logger.debug('Broker RPC test result:', brokerTest);
      
    } catch (error) {
      logger.error('RPC test failed:', error);
    }
  }, [slug, effectivePropertySlug]);

  // Expor função de debug globalmente para testes manuais
  // Register testRPCFunctions globally for debugging in browser console
  useEffect(() => {
    (window as any).testRPCFunctions = testRPCFunctions;
    return () => {
      delete (window as any).testRPCFunctions;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remover dependência para evitar re-criação constante

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselApi, thumbnailCarouselApi]);  if (loading) {
    return (
      <div className={`min-h-screen animate-fade-in transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-slate-50 to-gray-100'
      }`}>
        {/* Fixed Header Skeleton */}
        <header className={`fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} backdrop-blur-md shadow-lg border-b z-50 transition-colors duration-300`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
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
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Property Info Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Title and basic info */}
                <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-2xl shadow-lg p-8 space-y-6 animate-scale-in transition-colors duration-300`}>
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
                <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-2xl shadow-lg p-8 space-y-6 animate-scale-in transition-colors duration-300`}>
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
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border'} rounded-2xl shadow-xl p-8 space-y-6 animate-scale-in transition-colors duration-300`}>
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

  // Estado de erro com mais opções
  if (error && !loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1A2331]' : 'bg-gradient-to-br from-slate-50 to-gray-100'} transition-colors duration-300`}>
        <div className={`text-center ${isDarkMode ? 'bg-[#1A2331] border border-[#1A2331]' : 'bg-white'} rounded-2xl shadow-xl p-12 animate-scale-in max-w-md transition-colors duration-300`}>
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3 transition-colors duration-300`}>Erro ao carregar imóvel</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 transition-colors duration-300`}>{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={() => {
                setError(null);
                fetchPropertyData(0);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tentar Novamente
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push(`/${slug || ''}`)}
              className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300 hover:text-white'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
              }`}
            >
              Voltar ao início
            </Button>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Debug Info</summary>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div>Slug: {slug}</div>
                  <div>Property Slug: {effectivePropertySlug}</div>
                  <div>Error: {error}</div>
                  <div>Custom Domain: {isCustomDomain() ? 'Yes' : 'No'}</div>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!property || !brokerProfile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1A2331]' : 'bg-gradient-to-br from-slate-50 to-gray-100'} transition-colors duration-300`}>
        <div className={`text-center ${isDarkMode ? 'bg-[#1A2331] border border-[#1A2331]' : 'bg-white'} rounded-2xl shadow-xl p-12 animate-scale-in transition-colors duration-300`}>
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 transition-colors duration-300`}>Imóvel não encontrado</h2>
          <Button 
            onClick={() => router.push(`/${slug || ''}`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const href = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {/**
       * Safe values for SSR: avoid accessing window during server-side rendering.
       * Use empty string fallbacks so Helmet rendering won't throw on the server.
       */}
      {typeof window !== 'undefined' ? null : null}
      {/* compute origin/href inside component scope */}
      {/** Note: using simple consts here ensures no ReferenceError during SSR */}
      {(() => {
        // IIFE only evaluates on render but won't access window on the server because
        // typeof window check prevents usage.
      })()}
      
      {/* safe origin/href for Helmet */}
      {/** These are declared as variables in the component scope (render). */}
      {/** We'll shadow them into JSX by declaring consts below before Helmet. */}
      
      {/** compute origin and href safely */}
      {(() => {
        // no-op IIFE to keep linter happy; real consts declared next line via let/const usage
      })()}
      
      {/* safe origin/href values */}
      {null}
      
      {/* actual safe constants */}
      {(() => {
        // These are intentionally calculated inline so TypeScript/React don't hoist them
        // and to avoid introducing top-level window access.
      })()}
      
      {/* We'll compute origin/href below and reference them inside Helmet */}
      
      {/** compute once */}
      {
        /* placeholder - real variables declared below */
      }

      {/* Meta tags dinâmicas para compartilhamento */}
      <Head>
        {/* Favicon dinâmico da imobiliária */}
        {brokerProfile?.site_favicon_url && (
          <>
            <link rel="icon" type="image/x-icon" href={brokerProfile.site_favicon_url} />
            <link rel="apple-touch-icon" href={brokerProfile.site_favicon_url} />
          </>
        )}
        
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
            (property.main_image_url.startsWith('http') ? property.main_image_url : `${origin}${property.main_image_url}`) :
            brokerProfile?.site_share_image_url ?
              (brokerProfile.site_share_image_url.startsWith('http') ?
                brokerProfile.site_share_image_url :
                `${origin}${brokerProfile.site_share_image_url}`) :
            brokerProfile?.header_brand_image_url ?
              (brokerProfile.header_brand_image_url.startsWith('http') ?
                brokerProfile.header_brand_image_url :
                `${origin}${brokerProfile.header_brand_image_url}`) :
            brokerProfile?.logo_url ? 
              (brokerProfile.logo_url.startsWith('http') ? brokerProfile.logo_url : `${origin}${brokerProfile.logo_url}`) :
              `${origin}/placeholder.svg`
          } 
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:type" content="website" />
  <meta property="og:site_name" content={brokerProfile?.business_name || 'Imobiliária'} />
  <meta property="og:url" content={href} />
        <meta name="robots" content={`${(brokerProfile?.robots_index ?? true) ? 'index' : 'noindex'}, ${(brokerProfile?.robots_follow ?? true) ? 'follow' : 'nofollow'}`} />
        <link rel="canonical" href={(() => {
          const preferCustom = brokerProfile?.canonical_prefer_custom_domain ?? true;
          const useCustom = preferCustom && brokerProfile?.custom_domain;
          if (useCustom) {
            return `https://${brokerProfile!.custom_domain!}/${property?.slug}`;
          }
          return `${origin}/${brokerProfile?.website_slug}/${property?.slug}`;
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
            (property.main_image_url.startsWith('http') ? property.main_image_url : `${origin}${property.main_image_url}`) :
            brokerProfile?.logo_url ? 
              (brokerProfile.logo_url.startsWith('http') ? brokerProfile.logo_url : `${origin}${brokerProfile.logo_url}`) :
              `${origin}/placeholder.svg`
          } 
        />
        
        {/* WhatsApp específico */}
        <meta property="whatsapp:image" 
          content={property?.main_image_url ? 
            (property.main_image_url.startsWith('http') ? property.main_image_url : `${origin}${property.main_image_url}`) :
            `${origin}/placeholder.svg`
          } 
        />

        {/* JSON-LD Structured Data: RealEstateListing para SEO aprimorado */}
        {property && (
          <>
            <script type="application/ld+json">
              {JSON.stringify({
                '@context': 'https://schema.org',
                '@type': ['RealEstateListing', 'Product'],
                name: property.title,
                description: property.description,
                url: href,
                image: propertyImages.map(img => 
                  img.startsWith('http') ? img : `${origin}${img}`
                ),
                sku: property.property_code || property.id,
                
                // Informações do imóvel
                ...(() => {
                  const listingType = property.transaction_type === 'sale' ? 'ForSale' : 'ForRent';
                  return {
                    '@type': 'RealEstateListing',
                    listingType: listingType,
                    address: {
                      '@type': 'PostalAddress',
                      streetAddress: property.address,
                      addressLocality: property.neighborhood,
                      addressRegion: property.uf,
                      addressCountry: 'BR'
                    },
                    numberOfRooms: property.bedrooms,
                    numberOfBathroomsTotal: property.bathrooms,
                    floorSize: {
                      '@type': 'QuantitativeValue',
                      value: property.area_m2,
                      unitCode: 'MTK'
                    }
                  };
                })(),

                // Oferta
                offers: {
                  '@type': 'Offer',
                  price: property.price,
                  priceCurrency: 'BRL',
                  availability: 'https://schema.org/InStock',
                  url: href,
                  priceValidUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
                  seller: {
                    '@type': 'RealEstateAgent',
                    name: brokerProfile?.business_name || 'Imobiliária',
                    url: origin,
                    logo: brokerProfile?.logo_url ? 
                      (brokerProfile.logo_url.startsWith('http') ? brokerProfile.logo_url : `${origin}${brokerProfile.logo_url}`) : 
                      undefined,
                    telephone: brokerContact?.whatsapp_number,
                    email: brokerContact?.contact_email
                  }
                },

                // Informações adicionais
                additionalProperty: [
                  ...(property.bedrooms ? [{
                    '@type': 'PropertyValue',
                    name: 'Quartos',
                    value: property.bedrooms
                  }] : []),
                  ...(property.bathrooms ? [{
                    '@type': 'PropertyValue',
                    name: 'Banheiros',
                    value: property.bathrooms
                  }] : []),
                  ...(property.parking_spaces ? [{
                    '@type': 'PropertyValue',
                    name: 'Vagas de Garagem',
                    value: property.parking_spaces
                  }] : []),
                  ...(property.area_m2 ? [{
                    '@type': 'PropertyValue',
                    name: 'Área',
                    value: `${property.area_m2}m²`
                  }] : [])
                ],

                // Corretor responsável (se disponível)
                ...(property.realtor_name ? {
                  agent: {
                    '@type': 'RealEstateAgent',
                    name: property.realtor_name,
                    ...(property.realtor_creci ? { creci: property.realtor_creci } : {})
                  }
                } : {})
              })}
            </script>

            {/* BreadcrumbList para navegação */}
            <script type="application/ld+json">
              {JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: brokerProfile?.business_name || 'Imobiliária',
                    item: origin
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Imóveis',
                    item: `${origin}/imoveis`
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: property.title,
                    item: href
                  }
                ]
              })}
            </script>
          </>
        )}
      </Head>

      <div className="property-detail-premium">
        {/* Header Premium - Melhorado com design moderno */}
        <header className={`fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-100'} backdrop-blur-xl shadow-soft-1 border-b z-50 transition-colors duration-300`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <div className="flex items-center min-w-0 flex-1 space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="hover:bg-gray-100 p-3 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline font-semibold text-sm">Voltar</span>
                </Button>
                
                <div className="flex items-center min-w-0 flex-1">
                  <h1 
                    className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight"
                    style={{ 
                      color: brokerProfile.detail_header_text_color || brokerProfile.primary_color || '#2563eb',
                    }}
                  >
                    Detalhes do Imóvel
                  </h1>
                </div>
                
                {/* Mantém botão invisível para facilitar navegação futura se necessário */}
                <button
                  onClick={() => router.push(`/${slug || ''}`)}
                  className="hidden"
                  aria-label="Voltar para home"
                >
                  {/* Removido logo + nome do header de detalhes */}
                  {brokerProfile.header_brand_image_url ? (
                    (() => {
                      const h = Math.min(brokerProfile.logo_size || 80, 60);
                      const w = Math.round(h * 5);
                      return (
                        <div
                          className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow"
                          style={{
                            height: `${h}px`,
                            width: `${w}px`,
                            maxWidth: '400px'
                          }}
                        >
                          <SafeImage
                            src={brokerProfile.header_brand_image_url}
                            alt={`${brokerProfile.business_name} - Logo e Nome`}
                            width={w}
                            height={h}
                            className="object-contain object-left"
                            sizes="(max-width: 640px) 300px, 400px"
                            fallbackColor={brokerProfile.primary_color}
                            priority
                          />
                        </div>
                      );
                    })()
                  ) : (
                    /* Opção 2: Logo + nome separados (comportamento atual) */
                    <>
                      {brokerProfile.logo_url ? (
                        <div 
                          className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow"
                          style={{ 
                            height: `${Math.min(brokerProfile.logo_size || 80, 60)}px`,
                            width: `${Math.min(brokerProfile.logo_size || 80, 60) * 2}px`
                          }}
                        >
                          <SafeImage 
                            src={brokerProfile.logo_url} 
                            alt={brokerProfile.business_name} 
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 120px, 160px"
                            fallbackColor={brokerProfile.primary_color}
                            priority
                          />
                        </div>
                      ) : (
                        <div 
                          className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: brokerProfile.primary_color || '#374151' }}
                        >
                          {brokerProfile.business_name?.charAt(0) || 'I'}
                        </div>
                      )}
                      <span className={`ml-3 text-lg sm:text-xl font-bold truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {brokerProfile.business_name}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-3 flex-shrink-0">
                {/* Botão de modo escuro elegante - FIXED Z-INDEX */}
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className={`hover:bg-gray-100 dark:hover:bg-gray-800 p-3 rounded-xl transition-all duration-300 hover:scale-105 relative z-50 ${
                    isDarkMode ? 'text-yellow-500' : 'text-gray-600'
                  }`}
                  title={isDarkMode ? "Modo claro" : "Modo escuro"}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShare}
                  className="hover:bg-gray-50 border-2 border-gray-200 hover:border-primary/30 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </Button>
                
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    property && isFavorited(property.id)
                      ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${property && isFavorited(property.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumbs Minimalista */}
        <div className="pt-20 sm:pt-24 pb-4">
          <div className="property-detail-premium__container">
            <nav className="property-detail-breadcrumbs">
              <button onClick={() => router.push(`/${slug}`)} className="property-detail-breadcrumbs__link">
                Início
              </button>
              <span className="property-detail-breadcrumbs__separator">→</span>
              <span className="property-detail-breadcrumbs__current truncate">
                Código {property.property_code || property.id.slice(-8)}
              </span>
            </nav>
          </div>
        </div>

        {/* Content Container Melhorado */}
        <div className="w-full pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8 xl:gap-12">
            {/* Gallery Column - 2 colunas */}
            <div className="lg:col-span-2">
              {/* Galeria de Imagens Mobile Premium */}
              {propertyImages.length > 0 ? (
                <div className="lg:hidden mb-8 relative">
                  <div className="property-detail-gallery">
                    <Carousel 
                      className="property-detail-gallery__main" 
                      setApi={setCarouselApi}
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                    >
                      <CarouselContent>
                        {propertyImages.map((image, index) => (
                          <CarouselItem key={index}>
                             <div className="relative h-80 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-2xl">
                               <SafeImage
                                 src={image}
                                 alt={`${property.title} - Imagem ${index + 1}`}
                                 fill
                                 className="object-cover cursor-pointer transition-transform duration-500 hover:scale-110"
                                 onClick={() => {setCurrentImageIndex(index); setIsImageModalOpen(true);}}
                                 loading={index === 0 ? "eager" : "lazy"}
                                 sizes="(max-width: 640px) 100vw, 640px"
                                 fallbackColor={brokerProfile?.primary_color}
                               />
                               {/* Overlay gradiente */}
                               <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                               
                               {/* Contador de fotos premium - TOP RIGHT */}
                               <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-semibold z-30 backdrop-blur-md">
                                 {currentImageIndex + 1} / {propertyImages.length}
                               </div>
                               
                               {/* Visualizações - TOP LEFT */}
                               <div className="absolute top-4 left-4 z-30">
                                 <Badge className="bg-white/90 text-gray-900 hover:bg-white px-3 py-1.5 text-xs font-medium rounded-full backdrop-blur-sm shadow-lg">
                                   <Eye className="h-3.5 w-3.5 mr-1.5" />
                                   {viewsCount}
                                 </Badge>
                               </div>
                               
                               {/* Botão expandir - DENTRO DA FOTO, CANTO SUPERIOR DIREITO */}
                               <button
                                 onClick={() => setIsImageModalOpen(true)}
                                 className="absolute top-16 right-4 bg-white/90 text-gray-800 p-2.5 rounded-full hover:bg-white transition-all duration-300 z-30 backdrop-blur-sm shadow-lg hover:scale-110"
                                 title="Ampliar imagem"
                               >
                                 <Maximize2 className="h-4 w-4" />
                               </button>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      
                      {/* Botões de navegação premium */}
                      {propertyImages.length > 1 && (
                        <>
                          <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 border-0 hover:bg-white z-20 backdrop-blur-sm rounded-full h-10 w-10 transition-all duration-300 shadow-lg hover:scale-110" />
                          <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 border-0 hover:bg-white z-20 backdrop-blur-sm rounded-full h-10 w-10 transition-all duration-300 shadow-lg hover:scale-110" />
                        </>
                      )}
                    </Carousel>
                    
                    {/* Thumbnails Mobile - ABAIXO DA FOTO PRINCIPAL */}
                    {propertyImages.length > 1 && (
                      <div className="bg-neutral-100 p-3 rounded-b-2xl">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                          {propertyImages.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => handleThumbnailClick(index)}
                              className={`property-detail-gallery__thumb flex-shrink-0 ${
                                index === currentImageIndex ? 'is-active' : ''
                              }`}
                            >
                              <SafeImage
                                src={image}
                                alt={`Miniatura ${index + 1}`}
                                fill
                                className="object-cover"
                                loading="lazy"
                                sizes="64px"
                                fallbackColor={brokerProfile?.primary_color}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-80 sm:h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center lg:hidden mb-8 rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 font-semibold">Nenhuma imagem disponível</p>
                  </div>
                </div>
              )}

              {/* Desktop Gallery Premium */}
              <div className="hidden lg:block mb-8">
                {propertyImages.length > 0 ? (
                  <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                    <SafeImage
                      key={`desktop-image-${currentImageIndex}`}
                      src={propertyImages[currentImageIndex]}
                      alt={`${property.title} - Imagem ${currentImageIndex + 1}`}
                      fill
                      className="object-cover transition-all duration-500"
                      loading="eager"
                      sizes="(max-width: 1024px) 100vw, 1024px"
                      priority
                      fallbackColor={brokerProfile?.primary_color}
                    />
                    
                    {/* Overlay gradiente premium */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Contador de fotos premium - TOP RIGHT */}
                    <div className="property-detail-gallery__counter">
                      {currentImageIndex + 1} / {propertyImages.length}
                    </div>
                    
                    {/* Visualizações - TOP LEFT */}
                    <div className="absolute top-6 left-6 z-20">
                      <Badge className="bg-white/95 text-gray-900 hover:bg-white px-6 py-3 text-sm font-bold rounded-full shadow-xl backdrop-blur-sm">
                        <Eye className="h-5 w-5 mr-2" />
                        {viewsCount} visualizações
                      </Badge>
                    </div>
                    
                    {/* Botão expandir premium - CANTO SUPERIOR DIREITO */}
                    <button
                      onClick={() => setIsImageModalOpen(true)}
                      className="property-detail-gallery__expand"
                      title="Ampliar imagem"
                    >
                      <Maximize2 className="h-6 w-6" />
                    </button>

                    {/* Botões de navegação premium - TRANSPARENTES */}
                    {propertyImages.length > 1 && (
                      <>
                        <button
                          onClick={() => handleThumbnailClick(currentImageIndex > 0 ? currentImageIndex - 1 : propertyImages.length - 1)}
                          className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-4 rounded-full hover:bg-white transition-all duration-300 z-20 backdrop-blur-sm shadow-xl hover:scale-110"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => handleThumbnailClick(currentImageIndex < propertyImages.length - 1 ? currentImageIndex + 1 : 0)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-4 rounded-full hover:bg-white transition-all duration-300 z-20 backdrop-blur-sm shadow-xl hover:scale-110"
                        >
                          <ChevronLeft className="h-6 w-6 rotate-180" />
                        </button>
                      </>
                    )}

                    {/* Desktop Thumbnails Premium - ABAIXO DA FOTO */}
                    {propertyImages.length > 1 && (
                      <div className="property-detail-gallery__thumbs-wrapper">
                        <div className="property-detail-gallery__thumbs">
                          {propertyImages.map((image, index) => (
                            <button
                              key={index}
                              data-thumbnail-index={index}
                              onClick={() => handleThumbnailClick(index)}
                              className={`property-detail-gallery__thumb ${
                                index === currentImageIndex ? 'is-active' : ''
                              }`}
                            >
                              <SafeImage
                                src={image}
                                alt={`Miniatura ${index + 1}`}
                                fill
                                className="object-cover bg-gray-100"
                                loading="lazy"
                                sizes="64px"
                                fallbackColor={brokerProfile?.primary_color}
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

              {/* Property Info Section Modernizada */}
              <div className="property-detail-main">
                {/* Title and Price Card Minimalista */}
                <div className="property-detail-header">
                  <div className="space-y-4">
                    <div>
                      <h1 className="property-detail-title">
                        {property.title}
                      </h1>
                      <div className="property-detail-location">
                        <MapPin className="h-5 w-5" />
                        <span>{property.neighborhood}, {property.uf}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="inline-flex items-baseline gap-2">
                          <span className="property-detail-price">
                            {formatPrice(property.price)}
                          </span>
                          {property.transaction_type === 'rent' && (
                            <span className="text-gray-500 text-sm">/ mês</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <FeeBadge label="Condomínio" amount={property.hoa_fee} periodicity={property.hoa_periodicity} />
                          <FeeBadge label="IPTU" amount={property.iptu_value} periodicity={property.iptu_periodicity} />
                        </div>
                      </div>
                      <div className="property-detail-code">
                        Código: {property.property_code || property.id.slice(-8)}
                      </div>
                    </div>
                    
                    {/* Property Features Compactas e Elegantes */}
                    <div className="property-detail-features__grid">
                      {property.bedrooms > 0 && (
                        <div className="property-detail-feature">
                          <Bed className="property-detail-feature__icon" />
                          <div className="property-detail-feature__content">
                            <span className="property-detail-feature__value">{property.bedrooms}</span>
                            <span className="property-detail-feature__label">Quartos</span>
                          </div>
                        </div>
                      )}
                      {property.bathrooms > 0 && (
                        <div className="property-detail-feature">
                          <Bath className="property-detail-feature__icon" />
                          <div className="property-detail-feature__content">
                            <span className="property-detail-feature__value">{property.bathrooms}</span>
                            <span className="property-detail-feature__label">Banheiros</span>
                          </div>
                        </div>
                      )}
                      {property.area_m2 && (
                        <div className="property-detail-feature">
                          <Square className="property-detail-feature__icon" />
                          <div className="property-detail-feature__content">
                            <span className="property-detail-feature__value">{property.area_m2}m²</span>
                            <span className="property-detail-feature__label">Área</span>
                          </div>
                        </div>
                      )}
                      {property.parking_spaces > 0 && (
                        <div className="property-detail-feature">
                          <Car className="property-detail-feature__icon" />
                          <div className="property-detail-feature__content">
                            <span className="property-detail-feature__value">{property.parking_spaces}</span>
                            <span className="property-detail-feature__label">Vagas</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Type and Transaction Badges Premium */}
                    <div className="property-detail-badges">
                      <span className="property-detail-badge property-detail-badge--type">
                        {property.property_type}
                      </span>
                      <span className="property-detail-badge property-detail-badge--transaction">
                        {property.transaction_type === 'sale' ? 'Venda' : 'Aluguel'}
                      </span>
                      {property.is_featured && (
                        <span className="property-detail-badge property-detail-badge--featured">
                          ⭐ Destaque
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conteúdo Unificado Premium - Tabs + Detalhes/Características */}
                <div className="property-detail-content-block">
                  {/* Tabs Premium */}
                  <div className="property-detail-tabs">
                    {['Detalhes', 'Características'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as 'Detalhes' | 'Características')}
                        className={`property-detail-tab ${activeTab === tab ? 'is-active' : ''}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Conteúdo da Tab Ativa */}
                  <div className="property-detail-content-section">
                    {activeTab === 'Detalhes' && (
                      <div className="space-y-6">
                        {/* Descrição */}
                        <div>
                          <h2 className="property-detail-content-section__title">
                            <svg className="property-detail-content-section__title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Descrição
                          </h2>
                          <div className="prose max-w-none">
                            {property.description ? (
                              <p className="property-detail-description__text">{property.description}</p>
                            ) : (
                              <p className="text-gray-500 italic text-sm">Nenhuma descrição disponível.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Características' && (
                      <div>
                        <h2 className="property-detail-content-section__title">
                          <svg className="property-detail-content-section__title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Características
                        </h2>
                        {/* Layout em duas colunas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Coluna Esquerda */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                              Características Gerais
                            </div>
                            
                            {/* Itens vindos de features (texto livre) */}
                            {property.features && property.features.length > 0 && property.features.map((feature, index) => (
                              <div key={`feat-${index}`} className="flex items-center py-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                                <span>{feature}</span>
                              </div>
                            ))}

                            {/* Itens estruturados */}
                          {property.private_area_m2 && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Área privativa: {property.private_area_m2}m²</span>
                            </div>
                          )}
                          {property.total_area_m2 && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Área total: {property.total_area_m2}m²</span>
                            </div>
                          )}
                          {property.suites != null && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Suítes: {property.suites}</span>
                            </div>
                          )}
                          {property.covered_parking_spaces != null && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Vagas cobertas: {property.covered_parking_spaces}</span>
                            </div>
                          )}
                          {property.floor_number != null && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Andar: {property.floor_number}</span>
                            </div>
                          )}
                          {property.total_floors != null && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Total de andares: {property.total_floors}</span>
                            </div>
                          )}
                          {property.built_year && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Ano de construção: {property.built_year}</span>
                            </div>
                          )}
                          {property.sunlight_orientation && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Face do sol: {property.sunlight_orientation}</span>
                            </div>
                          )}
                              </div>

                          {/* Coluna Direita - Condições e comodidades */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                              Condições & Comodidades
                            </div>
                            
                          {property.property_condition && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Condição: {property.property_condition}</span>
                            </div>
                          )}
                          {property.water_cost != null && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Água: {formatPrice(property.water_cost)}</span>
                            </div>
                          )}
                          {property.electricity_cost != null && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Luz: {formatPrice(property.electricity_cost)}</span>
                            </div>
                          )}
                          {typeof property.furnished === 'boolean' && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Mobiliado: {property.furnished ? 'Sim' : 'Não'}</span>
                            </div>
                          )}
                          {typeof property.accepts_pets === 'boolean' && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Aceita pets: {property.accepts_pets ? 'Sim' : 'Não'}</span>
                            </div>
                          )}
                          {typeof property.elevator === 'boolean' && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Elevador: {property.elevator ? 'Sim' : 'Não'}</span>
                            </div>
                          )}
                          {typeof property.portaria_24h === 'boolean' && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Portaria 24h: {property.portaria_24h ? 'Sim' : 'Não'}</span>
                            </div>
                          )}
                          {typeof property.gas_included === 'boolean' && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Gás incluso: {property.gas_included ? 'Sim' : 'Não'}</span>
                            </div>
                          )}
                          {typeof property.accessibility === 'boolean' && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Acessibilidade: {property.accessibility ? 'Sim' : 'Não'}</span>
                            </div>
                          )}
                          {property.heating_type && (
                            <div className="flex items-center py-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                              <span>Aquecimento: {property.heating_type}</span>
                            </div>
                          )}
                          </div>
                        </div>

                        {/* Observações ocupam toda a largura */}
                        {property.notes && (
                          <div className="mt-6 p-4 rounded-lg border border-primary-200 bg-primary-50">
                            <div className="text-xs text-gray-600 mb-2 font-medium">📝 Observações</div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{property.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Localização - Integrada ao bloco unificado */}
                <div className="property-detail-content-section">
                  <h2 className="property-detail-content-section__title">
                    <MapPin className="property-detail-content-section__title-icon" />
                    Localização
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700 text-sm bg-primary-50 p-3 rounded-lg border border-primary-200">
                      <MapPin className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="font-medium">{property.address}</span>
                    </div>
                    
                    {/* Mapa OpenStreetMap Integrado - GRATUITO */}
                    <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-neutral-200 shadow-md">
                      <iframe
                        title="Mapa da localização"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
                          // Coordenadas aproximadas baseadas no endereço
                          // Format: longitude_min,latitude_min,longitude_max,latitude_max
                          `-46.70,-23.60,-46.60,-23.50`
                        )}&layer=mapnik&marker=${encodeURIComponent(
                          `-23.55,-46.65`
                        )}`}
                        allowFullScreen
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-white text-xs font-medium hover:underline"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          Ver no Google Maps
                        </a>
                      </div>
                    </div>
                    
                    {/* Informações complementares */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-neutral-50 p-3 rounded-lg">
                        <p className="text-gray-500 mb-1">Bairro</p>
                        <p className="font-semibold text-gray-900">{property.neighborhood}</p>
                      </div>
                      <div className="bg-neutral-50 p-3 rounded-lg">
                        <p className="text-gray-500 mb-1">Cidade/Estado</p>
                        <p className="font-semibold text-gray-900">{property.city || property.uf}</p>
                      </div>
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
                          onClick={() => router.push(`/${slug}/${similar.slug}`)}
                          className="bg-gray-50 rounded-lg p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                        >
                          <div className="relative aspect-video bg-gray-200 rounded-lg mb-2 sm:mb-3 overflow-hidden">
                            {similar.main_image_url ? (
                              <SafeImage
                                src={similar.main_image_url}
                                alt={similar.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 50vw"
                                fallbackColor={brokerProfile?.primary_color}
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
                          {typeof similar.hoa_fee === 'number' && (similar.hoa_fee ?? 0) > 0 && (
                            <div className="text-[11px] sm:text-xs text-gray-600 mb-1">
                              Condomínio {formatPrice(similar.hoa_fee!)}
                              {(similar.hoa_periodicity === 'monthly') && ' / mês'}
                              {(similar.hoa_periodicity === 'annual') && ' / ano'}
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
              <div className="sticky top-20 sm:top-24 property-detail-sidebar">
                <div className="property-detail-cta-card">
                  <div className="text-center">
                    <h3 className="property-detail-cta__title">Interessado?</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">Entre em contato conosco</p>
                  </div>
                  
                  <div className="property-detail-cta__buttons">
                    <Button 
                      onClick={handleWhatsAppClick}
                      className="property-detail-cta__button-primary"
                      style={{ 
                        background: brokerProfile?.whatsapp_button_color || '#25D366'
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.69"/>
                      </svg>
                      {brokerProfile?.whatsapp_button_text || 'WhatsApp'}
                    </Button>
                    
                    <Button 
                      onClick={handleContactLead}
                      className="property-detail-cta__button-secondary"
                    >
                      Tenho Interesse
                    </Button>
                    
                    <Button 
                      onClick={handleShare}
                      className="property-detail-cta__button-secondary"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                  
                  {/* Broker/Realtor Info */}
                  {property?.realtor_name && (
                    <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} transition-colors duration-300`}>
                      <div className="flex items-center space-x-3">
                        {property?.realtor_avatar_url ? (
                          <SafeImage 
                            src={property.realtor_avatar_url} 
                            alt={property.realtor_name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            fallbackColor={brokerProfile?.primary_color}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {property.realtor_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {property.realtor_name}
                          </p>
                          {property?.realtor_creci && (
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              CRECI: {property.realtor_creci}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Property Stats - Design Minimalista Elegante */}
                  <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} transition-colors duration-300`}>
                    <div className={`flex items-center justify-between rounded-xl p-4 border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-600' 
                        : 'bg-gradient-to-r from-gray-50/50 to-gray-100/50 border-gray-100'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg shadow-sm transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <Eye className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`} />
                        </div>
                        <div>
                          <div className={`text-lg font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{viewsCount}</div>
                          <div className={`text-xs font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>visualizações</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode ? 'bg-green-900/50' : 'bg-green-50'
                        }`}>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>Online</div>
                          <div className={`text-xs font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>disponível</div>
                        </div>
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
        
        {/* Contact CTA Section with Full Width Background */}
        <ContactCTA brokerProfile={brokerProfile} />
        </div>
      </div>

      {/* Footer */}
      <Footer 
        brokerProfile={brokerProfile}
        socialLinks={socialLinks}
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

      {/* Floating Favorites Button */}
      <FloatingFavoritesButton />
    </>
  );
};

export default PropertyDetailPage;