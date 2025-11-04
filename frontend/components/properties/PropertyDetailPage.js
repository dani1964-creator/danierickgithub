"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const react_helmet_async_1 = require("react-helmet-async");
const lucide_react_1 = require("lucide-react");
const zoomable_image_1 = require("@/components/ui/zoomable-image");
const client_1 = require("@/integrations/supabase/client");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const use_toast_1 = require("@/hooks/use-toast");
const carousel_1 = require("@/components/ui/carousel");
const dialog_1 = require("@/components/ui/dialog");
const skeleton_1 = require("@/components/ui/skeleton");
const useTracking_1 = require("@/hooks/useTracking");
const use_mobile_1 = require("@/hooks/use-mobile");
const useDomainAware_1 = require("@/hooks/useDomainAware");
const ContactCTA_1 = __importDefault(require("@/components/home/ContactCTA"));
const Footer_1 = __importDefault(require("@/components/home/Footer"));
const LeadModal_1 = __importDefault(require("@/components/leads/LeadModal"));
const utils_1 = require("@/lib/utils");
const seo_1 = require("@/lib/seo");
const logger_1 = require("@/lib/logger");
const detail_prefetch_1 = require("@/lib/detail-prefetch");
const PropertyDetailPage = () => {
    const { slug, propertySlug: propertySlugParam } = (0, react_router_dom_1.useParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { toast } = (0, use_toast_1.useToast)();
    // Refs para evitar dependências desnecessárias no useCallback
    const toastRef = (0, react_1.useRef)(toast);
    const navigateRef = (0, react_1.useRef)(navigate);
    // Atualizar refs quando funções mudarem
    (0, react_1.useEffect)(() => {
        toastRef.current = toast;
        navigateRef.current = navigate;
    }, [toast, navigate]);
    const { trackPropertyView, trackPropertyInterest, trackWhatsAppClick } = (0, useTracking_1.useTracking)();
    const isMobile = (0, use_mobile_1.useIsMobile)();
    const [property, setProperty] = (0, react_1.useState)(null);
    const [brokerProfile, setBrokerProfile] = (0, react_1.useState)(null);
    const [brokerContact, setBrokerContact] = (0, react_1.useState)(null);
    const [socialLinks, setSocialLinks] = (0, react_1.useState)([]);
    const [similarProperties, setSimilarProperties] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [currentImageIndex, setCurrentImageIndex] = (0, react_1.useState)(0);
    const [isImageModalOpen, setIsImageModalOpen] = (0, react_1.useState)(false);
    const [showLeadModal, setShowLeadModal] = (0, react_1.useState)(false);
    const [viewsCount, setViewsCount] = (0, react_1.useState)(0);
    const [carouselApi, setCarouselApi] = (0, react_1.useState)();
    const [thumbnailCarouselApi, setThumbnailCarouselApi] = (0, react_1.useState)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('Detalhes');
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(() => {
        try {
            const saved = localStorage.getItem('property-detail-dark-mode');
            return saved ? JSON.parse(saved) : false;
        }
        catch {
            return false;
        }
    });
    // Aplicar classe dark ao documento quando isDarkMode mudar
    (0, react_1.useEffect)(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);
    const { getBrokerByDomainOrSlug, isCustomDomain } = (0, useDomainAware_1.useDomainAware)();
    // Para domínios customizados, a rota é /:propertySlug (sem broker slug). Tratar isso aqui.
    const effectivePropertySlug = propertySlugParam || (isCustomDomain() ? slug : undefined);
    const fetchPropertyData = (0, react_1.useCallback)(async (retryCount = 0) => {
        setLoading(true);
        setError(null);
        try {
            logger_1.logger.debug('🏠 Fetching property data...', {
                propertySlug: effectivePropertySlug,
                slug,
                retryCount
            });
            // Teste básico de conectividade
            try {
                const { error: pingError } = await client_1.supabase
                    .from('properties')
                    .select('id')
                    .limit(1);
                if (pingError) {
                    logger_1.logger.warn('Connectivity test warning:', pingError);
                }
            }
            catch (connectError) {
                logger_1.logger.error('Connection test failed:', connectError);
                if (retryCount < 2) {
                    logger_1.logger.info(`Retrying connection... (${retryCount + 1}/3)`);
                    setTimeout(() => fetchPropertyData(retryCount + 1), 1000 * (retryCount + 1));
                    return;
                }
                throw new Error('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
            }
            // Descobrir o slug do broker quando estamos em domínio customizado
            let effectiveSlug = slug;
            if (!effectiveSlug && isCustomDomain()) {
                logger_1.logger.debug('Custom domain detected, fetching broker data...');
                const broker = await getBrokerByDomainOrSlug(undefined);
                if (!broker) {
                    logger_1.logger.error('Corretor não encontrado para este domínio');
                    throw new Error('Corretor não encontrado para este domínio.');
                }
                effectiveSlug = broker?.website_slug || undefined;
                logger_1.logger.debug('Broker slug found:', effectiveSlug);
            }
            if (!effectivePropertySlug || !effectiveSlug) {
                logger_1.logger.error('Missing parameters:', { effectivePropertySlug, effectiveSlug });
                throw new Error('Parâmetros insuficientes para carregar o imóvel.');
            }
            // Tenta hidratar com dados pré-carregados (se existirem)
            const cached = (0, detail_prefetch_1.getPrefetchedDetail)(effectiveSlug, effectivePropertySlug);
            if (cached) {
                // Hidrata a partir do cache sem capturar state no fechamento do hook
                setProperty((prev) => prev ?? cached.property);
                setBrokerProfile((prev) => prev ?? cached.brokerProfile);
                setLoading(false); // render imediato
            }
            // Executa consultas em paralelo para reduzir TTFB
            logger_1.logger.debug('Calling RPC functions with params:', {
                broker_slug: effectiveSlug,
                property_slug: effectivePropertySlug
            });
            const [propertyResult, brokerResult] = await Promise.all([
                client_1.supabase.rpc('get_public_property_detail_with_realtor', {
                    broker_slug: effectiveSlug,
                    property_slug: effectivePropertySlug
                }),
                client_1.supabase.rpc('get_public_broker_branding', {
                    broker_website_slug: effectiveSlug
                })
            ]);
            logger_1.logger.debug('Property RPC result:', propertyResult);
            logger_1.logger.debug('Broker RPC result:', brokerResult);
            const { data: propertyDataArray, error: propertyError } = propertyResult;
            const { data: brokerDataArray, error: brokerError } = brokerResult;
            logger_1.logger.debug('Property data from RPC:', propertyDataArray);
            logger_1.logger.debug('Broker data from RPC:', brokerDataArray);
            if (propertyError) {
                logger_1.logger.error('Property RPC error:', propertyError);
                // Fallback: tentar consulta direta se RPC falhar
                logger_1.logger.info('Attempting fallback query for property...');
                const fallbackProperty = await client_1.supabase
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
                    logger_1.logger.error('Fallback property query failed:', fallbackProperty.error);
                    throw new Error(`Erro ao carregar propriedade: ${fallbackProperty.error.message}`);
                }
                logger_1.logger.debug('Fallback property data:', fallbackProperty.data);
            }
            if (brokerError) {
                logger_1.logger.error('Broker RPC error:', brokerError);
                throw new Error(`Erro ao carregar dados do corretor: ${brokerError.message}`);
            }
            if (!propertyDataArray || propertyDataArray.length === 0) {
                logger_1.logger.error('No property data returned from RPC');
                throw new Error('Propriedade não encontrada');
            }
            const propertyData = propertyDataArray[0];
            logger_1.logger.debug('Property data:', propertyData);
            logger_1.logger.debug('Broker data array:', brokerDataArray);
            const brokerData = brokerDataArray?.[0];
            logger_1.logger.debug('Broker data:', brokerData);
            if (brokerError) {
                logger_1.logger.error('Broker error:', brokerError);
                throw brokerError;
            }
            if (!brokerData) {
                throw new Error('Corretor não encontrado');
            }
            // Fetch similar properties (não bloqueia render principal)
            const similarPromise = client_1.supabase
                .from('properties')
                .select('*, slug')
                .eq('is_active', true)
                .eq('property_type', propertyData.property_type)
                .eq('transaction_type', propertyData.transaction_type)
                .eq('broker_id', brokerData.id)
                .neq('id', propertyData.id)
                .limit(6);
            const { data: similarData, error: similarError } = await similarPromise;
            if (similarError)
                logger_1.logger.warn('Similar properties error:', similarError);
            // Fetch social links (não bloqueia render principal)
            const { data: socialData, error: socialError } = await client_1.supabase
                .from('social_links')
                .select('*')
                .eq('broker_id', brokerData.id)
                .eq('is_active', true);
            if (socialError) {
                logger_1.logger.warn('Error fetching social links:', socialError);
            }
            logger_1.logger.debug('Realtor data from RPC:', {
                realtor_name: propertyData.realtor_name,
                realtor_avatar_url: propertyData.realtor_avatar_url,
                realtor_creci: propertyData.realtor_creci
            });
            setProperty(propertyData);
            setBrokerProfile(brokerData);
            // Atualiza cache de prefetch para navegações futuras
            (0, detail_prefetch_1.setPrefetchedDetail)(effectiveSlug, effectivePropertySlug, {
                property: propertyData,
                brokerProfile: brokerData,
            });
            setSimilarProperties(similarData || []);
            setSocialLinks(socialData || []);
            setViewsCount(propertyData.views_count || 0);
            // Atualiza contador de views sem bloquear a UI
            const updatedViews = (propertyData.views_count || 0) + 1;
            setViewsCount(updatedViews);
            (async () => {
                try {
                    const { error: updateError } = await client_1.supabase
                        .from('properties')
                        .update({ views_count: updatedViews })
                        .eq('id', propertyData.id);
                    if (updateError)
                        logger_1.logger.warn('views_count update error:', updateError.message || updateError);
                }
                catch (e) {
                    logger_1.logger.warn('views_count update failed:', e);
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
        }
        catch (error) {
            logger_1.logger.error('Error loading property:', error);
            // Tratamento específico para diferentes tipos de erro
            let errorMessage = '';
            let shouldRetry = false;
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                errorMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
                shouldRetry = true;
            }
            else if (error instanceof Error) {
                if (error.message.includes('TypeError: Failed to fetch')) {
                    errorMessage = 'Erro de conexão com o servidor. Tentando novamente...';
                    shouldRetry = true;
                }
                else {
                    errorMessage = error.message;
                }
            }
            else {
                errorMessage = (0, utils_1.getErrorMessage)(error);
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
                    logger_1.logger.info('Auto-retrying after connection error...');
                    fetchPropertyData(0);
                }, 2000);
            }
            else {
                toast({
                    title: "Erro ao carregar imóvel",
                    description: errorMessage,
                    variant: "destructive"
                });
            }
            // Não navegar imediatamente - dar opção ao usuário
            logger_1.logger.info('Error occurred, showing error state instead of navigating');
        }
        finally {
            setLoading(false);
        }
    }, [effectivePropertySlug, slug]);
    (0, react_1.useEffect)(() => {
        if (effectivePropertySlug) {
            fetchPropertyData();
        }
    }, [effectivePropertySlug, fetchPropertyData]);
    // Fallback de carregamento já existente mais abaixo
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(price);
    };
    const getPeriodicityLabel = (p) => {
        if (!p)
            return '';
        const map = {
            monthly: 'mês',
            annual: 'ano',
            yearly: 'ano',
            other: 'período',
        };
        return map[p] || p;
    };
    const FeeBadge = ({ label, amount, periodicity }) => {
        if (amount == null || isNaN(amount))
            return null;
        return ((0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-1 px-3 py-1 rounded-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-700'} text-xs sm:text-sm transition-colors duration-300`, children: [(0, jsx_runtime_1.jsxs)("span", { className: `font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`, children: [label, ":"] }), (0, jsx_runtime_1.jsx)("span", { children: formatPrice(amount) }), periodicity && ((0, jsx_runtime_1.jsxs)("span", { className: `${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`, children: ["/ ", getPeriodicityLabel(periodicity)] }))] }));
    };
    const handleContactLead = async () => {
        logger_1.logger.debug('handleContactLead chamada - Dados:', {
            property: property?.id,
            brokerProfile: brokerProfile?.id,
            website_slug: brokerProfile?.website_slug
        });
        if (!property) {
            logger_1.logger.error('Property não encontrada');
            return;
        }
        // Abrir modal de cadastro de lead
        setShowLeadModal(true);
    };
    const handleLeadSuccess = async (leadData) => {
        logger_1.logger.info('Lead cadastrado com sucesso:', leadData);
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
            logger_1.logger.warn('No broker profile or website_slug available');
            return null;
        }
        try {
            logger_1.logger.debug('Fetching contact info for:', brokerProfile.website_slug);
            const { data, error } = await client_1.supabase.rpc('get_public_broker_contact', {
                broker_website_slug: brokerProfile.website_slug
            });
            logger_1.logger.debug('Contact RPC response:', { data, error });
            if (error) {
                logger_1.logger.error('Error fetching contact info:', error);
                return null;
            }
            const contactInfo = data && data.length > 0 ? data[0] : null;
            logger_1.logger.debug('Parsed contact info:', contactInfo);
            if (contactInfo) {
                setBrokerContact(contactInfo);
                return contactInfo;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error fetching contact info:', error);
            return null;
        }
    };
    const handleWhatsAppClick = async () => {
        logger_1.logger.debug('handleWhatsAppClick chamada');
        if (!property) {
            logger_1.logger.error('Property não encontrada no handleWhatsAppClick');
            return;
        }
        // Fetch contact info if not already loaded
        let contactInfo = brokerContact;
        if (!contactInfo) {
            logger_1.logger.debug('Buscando informações de contato...');
            contactInfo = await fetchContactInfo();
        }
        logger_1.logger.debug('Contact info:', contactInfo);
        if (contactInfo?.whatsapp_number && property) {
            // Generate clean URL based on domain type
            const currentOrigin = window.location.origin;
            const currentPath = window.location.pathname;
            // Sempre usar URL limpa baseada em slug do corretor e slug do imóvel
            const brokerSlug = brokerProfile?.website_slug || slug;
            const shareUrl = (0, seo_1.getPublicUrl)(brokerSlug, property.slug);
            const message = encodeURIComponent(`Olá! Tenho interesse no imóvel "${property.title}" - Código: ${property.property_code || property.id.slice(-8)}. Valor: ${formatPrice(property.price)}. Gostaria de mais informações. Link: ${shareUrl}`);
            logger_1.logger.info('Abrindo WhatsApp e registrando lead...');
            // Detectar se é mobile para usar link apropriado
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const whatsappUrl = isMobile
                ? `whatsapp://send?phone=${contactInfo.whatsapp_number}&text=${message}`
                : `https://wa.me/${contactInfo.whatsapp_number}?text=${message}`;
            logger_1.logger.debug('WhatsApp URL:', whatsappUrl);
            // Tentar abrir WhatsApp
            try {
                // Abrir diretamente a URL pública do imóvel (padrão do sistema)
                window.open(shareUrl, '_blank');
            }
            catch (error) {
                logger_1.logger.error('Erro ao abrir URL pública:', error);
                // Fallback para abrir a página pública diretamente
                window.open(shareUrl, '_blank');
            }
            // Registrar interesse também
            setShowLeadModal(true);
            // Track WhatsApp click for pixels
            trackWhatsAppClick({
                property_id: property.id,
                source: 'property_detail'
            });
        }
        else {
            logger_1.logger.error('Informações de contato não disponíveis:', { contactInfo, property });
            toast({
                title: "Informações de contato não disponíveis",
                description: "Tente novamente em alguns instantes.",
                variant: "destructive"
            });
        }
    };
    const handleShare = () => {
        if (!property || !brokerProfile)
            return;
        // Usar URL direta do site (via helper centralizado)
        const brokerSlug = brokerProfile.website_slug || slug;
        const shareUrl = (0, seo_1.getPublicUrl)(brokerSlug, property.slug);
        if (navigator.share) {
            navigator.share({
                title: property.title,
                text: `Confira este imóvel: ${property.title}`,
                url: shareUrl,
            });
        }
        else {
            navigator.clipboard.writeText(shareUrl);
            toast({
                title: "Link copiado!",
                description: "O link do imóvel foi copiado para a área de transferência."
            });
        }
    };
    const handleFavorite = () => {
        if (!property)
            return;
        const favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
        const isFavorited = favorites.includes(property.id);
        if (isFavorited) {
            const newFavorites = favorites.filter((id) => id !== property.id);
            localStorage.setItem('favoriteProperties', JSON.stringify(newFavorites));
            toast({
                title: "Removido dos favoritos",
                description: "O imóvel foi removido da sua lista de favoritos."
            });
        }
        else {
            favorites.push(property.id);
            localStorage.setItem('favoriteProperties', JSON.stringify(favorites));
            toast({
                title: "Adicionado aos favoritos",
                description: "O imóvel foi adicionado à sua lista de favoritos."
            });
        }
    };
    const isFavorited = () => {
        if (!property)
            return false;
        const favorites = JSON.parse(localStorage.getItem('favoriteProperties') || '[]');
        return favorites.includes(property.id);
    };
    const propertyImages = property?.images && property.images.length > 0
        ? property.images
        : property?.main_image_url
            ? [property.main_image_url]
            : [];
    // Sync carousel with thumbnails
    const handleThumbnailClick = (0, react_1.useCallback)((index) => {
        setCurrentImageIndex(index);
        if (carouselApi) {
            carouselApi.scrollTo(index);
        }
    }, [carouselApi]);
    // Função para alternar modo escuro
    const toggleDarkMode = (0, react_1.useCallback)(() => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('property-detail-dark-mode', JSON.stringify(newMode));
        // Aplicar classe dark ao documento
        if (newMode) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);
    // Função de debug para testar RPC
    const testRPCFunctions = (0, react_1.useCallback)(async () => {
        logger_1.logger.debug('Testing RPC functions...');
        try {
            const testSlug = slug || 'test-broker';
            const testPropertySlug = effectivePropertySlug || 'test-property';
            logger_1.logger.debug('Testing with params:', { testSlug, testPropertySlug });
            // Test property RPC
            logger_1.logger.debug('Testing get_public_property_detail_with_realtor...');
            const propertyTest = await client_1.supabase.rpc('get_public_property_detail_with_realtor', {
                broker_slug: testSlug,
                property_slug: testPropertySlug
            });
            logger_1.logger.debug('Property RPC test result:', propertyTest);
            // Test broker RPC
            logger_1.logger.debug('Testing get_public_broker_branding...');
            const brokerTest = await client_1.supabase.rpc('get_public_broker_branding', {
                broker_website_slug: testSlug
            });
            logger_1.logger.debug('Broker RPC test result:', brokerTest);
        }
        catch (error) {
            logger_1.logger.error('RPC test failed:', error);
        }
    }, [slug, effectivePropertySlug]);
    // Expor função de debug globalmente para testes manuais
    (0, react_1.useEffect)(() => {
        window.testRPCFunctions = testRPCFunctions;
        return () => {
            delete window.testRPCFunctions;
        };
    }, []); // Remover dependência para evitar re-criação constante
    // Listen to carousel changes and sync thumbnails
    (0, react_1.useEffect)(() => {
        if (!carouselApi)
            return;
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
                const thumbnailButton = desktopThumbnailsContainer.querySelector(`[data-thumbnail-index="${newIndex}"]`);
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
    }, [carouselApi, thumbnailCarouselApi]);
    if (loading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: `min-h-screen animate-fade-in transition-colors duration-300 ${isDarkMode
                ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                : 'bg-gradient-to-br from-slate-50 to-gray-100'}`, children: [(0, jsx_runtime_1.jsx)("header", { className: `fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} backdrop-blur-md shadow-lg border-b z-50 transition-colors duration-300`, children: (0, jsx_runtime_1.jsx)("div", { className: "w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center h-16 sm:h-20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center min-w-0 flex-1 space-x-4", children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-10 w-10 rounded-lg flex-shrink-0 shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-12 w-12 rounded-xl flex-shrink-0 shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-6 w-48 flex-shrink-0 shimmer", shimmer: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-10 w-28 rounded-lg shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-10 w-10 rounded-lg shimmer", shimmer: true })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-20", children: [(0, jsx_runtime_1.jsx)("div", { className: "relative h-80 sm:h-96 lg:h-[500px] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse", children: (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-6 left-0 right-0", children: (0, jsx_runtime_1.jsx)("div", { className: "flex justify-center space-x-2", children: Array.from({ length: 5 }).map((_, i) => ((0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-3 w-12 rounded-full bg-white/40 shimmer", shimmer: true }, i))) }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid lg:grid-cols-3 gap-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-2 space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: `${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-2xl shadow-lg p-8 space-y-6 animate-scale-in transition-colors duration-300`, children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-10 w-full max-w-2xl shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-6 w-3/4 max-w-lg shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-12 w-48 rounded-lg shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-4", children: Array.from({ length: 4 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2", children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-5 w-5 flex-shrink-0 shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-4 w-16 shimmer", shimmer: true })] }, i))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-2xl shadow-lg p-8 space-y-6 animate-scale-in transition-colors duration-300`, children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-8 w-40 shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: Array.from({ length: 5 }).map((_, i) => ((0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: `h-4 ${i === 4 ? 'w-2/3' : 'w-full'} shimmer`, shimmer: true }, i))) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "lg:col-span-1", children: (0, jsx_runtime_1.jsx)("div", { className: "sticky top-24", children: (0, jsx_runtime_1.jsxs)("div", { className: `${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border'} rounded-2xl shadow-xl p-8 space-y-6 animate-scale-in transition-colors duration-300`, children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-8 w-48 shimmer", shimmer: true }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-12 w-full rounded-lg shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-12 w-full rounded-lg shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-12 w-full rounded-lg shimmer", shimmer: true })] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-6 border-t space-y-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-16 w-16 rounded-full flex-shrink-0 shimmer", shimmer: true }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 flex-1", children: [(0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-5 w-3/4 shimmer", shimmer: true }), (0, jsx_runtime_1.jsx)(skeleton_1.Skeleton, { className: "h-4 w-1/2 shimmer", shimmer: true })] })] }) })] }) }) })] }) })] })] }));
    }
    // Estado de erro com mais opções
    if (error && !loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1A2331]' : 'bg-gradient-to-br from-slate-50 to-gray-100'} transition-colors duration-300`, children: (0, jsx_runtime_1.jsxs)("div", { className: `text-center ${isDarkMode ? 'bg-[#1A2331] border border-[#1A2331]' : 'bg-white'} rounded-2xl shadow-xl p-12 animate-scale-in max-w-md transition-colors duration-300`, children: [(0, jsx_runtime_1.jsx)("div", { className: "text-red-500 mb-4", children: (0, jsx_runtime_1.jsx)("svg", { className: "w-16 h-16 mx-auto", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), (0, jsx_runtime_1.jsx)("h2", { className: `text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3 transition-colors duration-300`, children: "Erro ao carregar im\u00F3vel" }), (0, jsx_runtime_1.jsx)("p", { className: `${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 transition-colors duration-300`, children: error }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: () => {
                                    setError(null);
                                    fetchPropertyData(0);
                                }, className: "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105", children: [(0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }), "Tentar Novamente"] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", onClick: () => navigate(`/${slug || ''}`), className: `w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${isDarkMode
                                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300 hover:text-white'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'}`, children: "Voltar ao in\u00EDcio" }), process.env.NODE_ENV === 'development' && ((0, jsx_runtime_1.jsxs)("details", { className: "mt-4 text-left", children: [(0, jsx_runtime_1.jsx)("summary", { className: "text-xs text-gray-500 cursor-pointer hover:text-gray-700", children: "Debug Info" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 text-xs text-gray-600 space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { children: ["Slug: ", slug] }), (0, jsx_runtime_1.jsxs)("div", { children: ["Property Slug: ", effectivePropertySlug] }), (0, jsx_runtime_1.jsxs)("div", { children: ["Error: ", error] }), (0, jsx_runtime_1.jsxs)("div", { children: ["Custom Domain: ", isCustomDomain() ? 'Yes' : 'No'] })] })] }))] })] }) }));
    }
    if (!property || !brokerProfile) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1A2331]' : 'bg-gradient-to-br from-slate-50 to-gray-100'} transition-colors duration-300`, children: (0, jsx_runtime_1.jsxs)("div", { className: `text-center ${isDarkMode ? 'bg-[#1A2331] border border-[#1A2331]' : 'bg-white'} rounded-2xl shadow-xl p-12 animate-scale-in transition-colors duration-300`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 transition-colors duration-300`, children: "Im\u00F3vel n\u00E3o encontrado" }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => navigate(`/${slug || ''}`), className: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105", children: "Voltar ao in\u00EDcio" })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_helmet_async_1.Helmet, { children: [(0, jsx_runtime_1.jsx)("title", { children: (() => {
                            const base = property ? `${property.title} - ${brokerProfile?.business_name || 'Imobiliária'}` : `${brokerProfile?.business_name || 'Imobiliária'}`;
                            const tpl = brokerProfile?.property_title_template?.trim();
                            if (!tpl || !property)
                                return base;
                            return tpl
                                .replace('{title}', property.title)
                                .replace('{business_name}', brokerProfile?.business_name || 'Imobiliária');
                        })() }), (0, jsx_runtime_1.jsx)("meta", { name: "description", content: (() => {
                            const base = property ? `${property.description?.slice(0, 160)} - ${formatPrice(property.price)} em ${property.neighborhood}, ${property.uf}` : `Confira este imóvel em ${brokerProfile?.business_name || 'nossa imobiliária'}`;
                            const tpl = brokerProfile?.property_description_template?.trim();
                            if (!tpl || !property)
                                return base;
                            return tpl
                                .replace('{price}', formatPrice(property.price))
                                .replace('{bedrooms}', String(property.bedrooms ?? ''))
                                .replace('{bathrooms}', String(property.bathrooms ?? ''))
                                .replace('{area_m2}', String(property.area_m2 ?? ''))
                                .replace('{neighborhood}', property.neighborhood || '')
                                .replace('{uf}', property.uf || '');
                        })() }), (0, jsx_runtime_1.jsx)("meta", { property: "og:title", content: property ?
                            `${property.title} - ${brokerProfile?.business_name || 'Imobiliária'}` :
                            `${brokerProfile?.business_name || 'Imobiliária'}` }), (0, jsx_runtime_1.jsx)("meta", { property: "og:description", content: property ?
                            `${formatPrice(property.price)} • ${property.bedrooms} quartos • ${property.bathrooms} banheiros • ${property.area_m2}m² em ${property.neighborhood}, ${property.uf}` :
                            `Confira este imóvel em ${brokerProfile?.business_name || 'nossa imobiliária'}` }), (0, jsx_runtime_1.jsx)("meta", { property: "og:image", content: property?.main_image_url ?
                            (property.main_image_url.startsWith('http') ? property.main_image_url : `${window.location.origin}${property.main_image_url}`) :
                            brokerProfile?.logo_url ?
                                (brokerProfile.logo_url.startsWith('http') ? brokerProfile.logo_url : `${window.location.origin}${brokerProfile.logo_url}`) :
                                `${window.location.origin}/placeholder.svg` }), (0, jsx_runtime_1.jsx)("meta", { property: "og:image:width", content: "1200" }), (0, jsx_runtime_1.jsx)("meta", { property: "og:image:height", content: "630" }), (0, jsx_runtime_1.jsx)("meta", { property: "og:image:type", content: "image/jpeg" }), (0, jsx_runtime_1.jsx)("meta", { property: "og:type", content: "website" }), (0, jsx_runtime_1.jsx)("meta", { property: "og:site_name", content: brokerProfile?.business_name || 'Imobiliária' }), (0, jsx_runtime_1.jsx)("meta", { property: "og:url", content: window.location.href }), (0, jsx_runtime_1.jsx)("meta", { name: "robots", content: `${(brokerProfile?.robots_index ?? true) ? 'index' : 'noindex'}, ${(brokerProfile?.robots_follow ?? true) ? 'follow' : 'nofollow'}` }), (0, jsx_runtime_1.jsx)("link", { rel: "canonical", href: (() => {
                            const preferCustom = brokerProfile?.canonical_prefer_custom_domain ?? true;
                            const useCustom = preferCustom && brokerProfile?.custom_domain;
                            if (useCustom) {
                                return `https://${brokerProfile.custom_domain}/${property?.slug}`;
                            }
                            return `${window.location.origin}/${brokerProfile?.website_slug}/${property?.slug}`;
                        })() }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:card", content: "summary_large_image" }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:title", content: property ?
                            `${property.title} - ${brokerProfile?.business_name || 'Imobiliária'}` :
                            `${brokerProfile?.business_name || 'Imobiliária'}` }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:description", content: property ?
                            `${formatPrice(property.price)} • ${property.bedrooms} quartos • ${property.bathrooms} banheiros • ${property.area_m2}m²` :
                            `Confira este imóvel em ${brokerProfile?.business_name || 'nossa imobiliária'}` }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:image", content: property?.main_image_url ?
                            (property.main_image_url.startsWith('http') ? property.main_image_url : `${window.location.origin}${property.main_image_url}`) :
                            brokerProfile?.logo_url ?
                                (brokerProfile.logo_url.startsWith('http') ? brokerProfile.logo_url : `${window.location.origin}${brokerProfile.logo_url}`) :
                                `${window.location.origin}/placeholder.svg` }), (0, jsx_runtime_1.jsx)("meta", { property: "whatsapp:image", content: property?.main_image_url ?
                            (property.main_image_url.startsWith('http') ? property.main_image_url : `${window.location.origin}${property.main_image_url}`) :
                            `${window.location.origin}/placeholder.svg` }), (0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", children: JSON.stringify({
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
                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: `min-h-screen transition-colors duration-300 ${isDarkMode
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                    : 'bg-gradient-to-br from-gray-50 to-white'}`, children: [(0, jsx_runtime_1.jsx)("header", { className: `fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-100'} backdrop-blur-xl shadow-soft-1 border-b z-50 transition-colors duration-300`, children: (0, jsx_runtime_1.jsx)("div", { className: "w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center h-16 sm:h-20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center min-w-0 flex-1 space-x-4", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "ghost", size: "sm", onClick: () => navigate(-1), className: "hover:bg-gray-100 p-3 rounded-xl transition-all duration-200 hover:scale-105", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "h-5 w-5 mr-2" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline font-semibold text-sm", children: "Voltar" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => navigate(`/${brokerProfile?.website_slug || slug}`), className: "flex items-center hover:opacity-80 transition-all duration-200 min-w-0 flex-1 group", children: [brokerProfile.logo_url ? ((0, jsx_runtime_1.jsx)("img", { src: brokerProfile.logo_url, alt: brokerProfile.business_name, className: "h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0 rounded-xl object-contain shadow-sm group-hover:shadow-md transition-shadow" })) : ((0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 sm:h-12 sm:w-12 rounded-xl text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm", style: { backgroundColor: brokerProfile.primary_color || '#374151' }, children: brokerProfile.business_name?.charAt(0) || 'I' })), (0, jsx_runtime_1.jsx)("span", { className: `ml-3 text-lg sm:text-xl font-bold truncate transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`, children: brokerProfile.business_name })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", onClick: toggleDarkMode, className: "hover:bg-gray-100 p-3 rounded-xl transition-all duration-300 hover:scale-105", title: isDarkMode ? "Modo claro" : "Modo escuro", children: isDarkMode ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Sun, { className: "h-4 w-4 text-yellow-500" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Moon, { className: "h-4 w-4 text-gray-600" })) }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", size: "sm", onClick: handleShare, className: "hover:bg-gray-50 border-2 border-gray-200 hover:border-primary/30 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Share2, { className: "h-4 w-4 mr-2" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Compartilhar" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", onClick: handleFavorite, className: `p-3 rounded-xl transition-all duration-200 ${isFavorited()
                                                    ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-100'}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Heart, { className: `h-5 w-5 ${isFavorited() ? 'fill-current' : ''}` }) })] })] }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "pt-20 sm:pt-24 pb-4", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("nav", { className: "flex items-center text-xs text-gray-500", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => navigate(`/${slug}`), className: "hover:text-gray-700 cursor-pointer transition-colors duration-200", children: "In\u00EDcio" }), (0, jsx_runtime_1.jsx)("span", { className: "mx-2 text-gray-300", children: "\u2192" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-gray-700 truncate", children: ["C\u00F3digo ", property.property_code || property.id.slice(-8)] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full pb-12", children: [(0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid lg:grid-cols-3 gap-8 xl:gap-12", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-2", children: [propertyImages.length > 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "lg:hidden mb-8 relative", children: [(0, jsx_runtime_1.jsxs)(carousel_1.Carousel, { className: "w-full rounded-2xl overflow-hidden shadow-soft-2", setApi: setCarouselApi, opts: {
                                                                align: "start",
                                                                loop: true,
                                                            }, children: [(0, jsx_runtime_1.jsx)(carousel_1.CarouselContent, { children: propertyImages.map((image, index) => ((0, jsx_runtime_1.jsx)(carousel_1.CarouselItem, { children: (0, jsx_runtime_1.jsxs)("div", { className: "relative h-80 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("img", { src: image, alt: `${property.title} - Imagem ${index + 1}`, className: "w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-110", onClick: () => { setCurrentImageIndex(index); setIsImageModalOpen(true); }, loading: index === 0 ? "eager" : "lazy" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" })] }) }, index))) }), propertyImages.length > 1 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(carousel_1.CarouselPrevious, { className: "absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 text-white border-0 hover:bg-white/20 z-20 backdrop-blur-sm rounded-full h-10 w-10 transition-all duration-300 opacity-60 hover:opacity-100" }), (0, jsx_runtime_1.jsx)(carousel_1.CarouselNext, { className: "absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 text-white border-0 hover:bg-white/20 z-20 backdrop-blur-sm rounded-full h-10 w-10 transition-all duration-300 opacity-60 hover:opacity-100" })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium z-30 backdrop-blur-sm", children: [currentImageIndex + 1, "/", propertyImages.length] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsImageModalOpen(true), className: "absolute bottom-4 right-4 bg-black/40 text-white p-2.5 rounded-full hover:bg-black/60 transition-all duration-300 z-30 backdrop-blur-sm opacity-70 hover:opacity-100 hover:scale-105", title: "Expandir imagem", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Maximize2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-4 left-4 z-30", children: (0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: "bg-black/40 text-white hover:bg-black/60 px-3 py-1.5 text-xs font-medium rounded-full backdrop-blur-sm transition-all duration-300 opacity-80 hover:opacity-100", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-3.5 w-3.5 mr-1.5" }), viewsCount] }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "h-80 sm:h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center lg:hidden mb-8 rounded-2xl", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-8 w-8 text-white" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 font-semibold", children: "Nenhuma imagem dispon\u00EDvel" })] }) })), (0, jsx_runtime_1.jsx)("div", { className: "hidden lg:block mb-8", children: propertyImages.length > 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "relative h-[600px] rounded-2xl overflow-hidden shadow-soft-3 bg-gradient-to-br from-gray-100 to-gray-200", children: [(0, jsx_runtime_1.jsx)("img", { src: propertyImages[currentImageIndex], alt: `${property.title} - Imagem ${currentImageIndex + 1}`, className: "w-full h-full object-cover transition-all duration-500 hover:scale-105", loading: "eager" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute top-6 right-6 bg-black/80 text-white px-6 py-3 rounded-full text-sm font-bold backdrop-blur-sm", children: [currentImageIndex + 1, " / ", propertyImages.length] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsImageModalOpen(true), className: "absolute bottom-6 right-6 bg-white/95 text-gray-800 p-4 rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:scale-110", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Maximize2, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-6 left-6", children: (0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: "bg-white/95 text-gray-900 hover:bg-white px-6 py-3 text-sm font-bold rounded-full shadow-lg", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-5 w-5 mr-2" }), viewsCount, " visualiza\u00E7\u00F5es"] }) }), propertyImages.length > 1 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleThumbnailClick(currentImageIndex > 0 ? currentImageIndex - 1 : propertyImages.length - 1), className: "absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-3 rounded-lg hover:bg-white transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleThumbnailClick(currentImageIndex < propertyImages.length - 1 ? currentImageIndex + 1 : 0), className: "absolute right-20 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-3 rounded-lg hover:bg-white transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "h-5 w-5 rotate-180" }) })] })), propertyImages.length > 1 && ((0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-6 left-6 right-20", children: (0, jsx_runtime_1.jsx)("div", { className: "desktop-thumbnails-container flex space-x-2 overflow-x-auto scrollbar-hide", children: propertyImages.map((image, index) => ((0, jsx_runtime_1.jsx)("button", { "data-thumbnail-index": index, onClick: () => handleThumbnailClick(index), className: `flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${index === currentImageIndex
                                                                            ? 'border-white shadow-lg'
                                                                            : 'border-white/50 hover:border-white/75'}`, children: (0, jsx_runtime_1.jsx)("img", { src: image, alt: `Miniatura ${index + 1}`, className: "w-full h-full object-cover bg-gray-100", loading: "lazy" }) }, index))) }) }))] })) : ((0, jsx_runtime_1.jsx)("div", { className: "h-[500px] bg-gray-200 flex items-center justify-center rounded-lg shadow-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-lg font-medium", children: "Nenhuma imagem dispon\u00EDvel" }) })) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg border border-gray-100 p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold text-gray-900 mb-2 leading-tight", children: property.title }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center text-gray-500 mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-4 w-4 mr-2" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm", children: [property.neighborhood, ", ", property.uf] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-baseline gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-2xl font-bold text-gray-900", children: formatPrice(property.price) }), property.transaction_type === 'rent' && ((0, jsx_runtime_1.jsx)("span", { className: "text-gray-500 text-sm", children: "/ m\u00EAs" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsx)(FeeBadge, { label: "Condom\u00EDnio", amount: property.hoa_fee, periodicity: property.hoa_periodicity }), (0, jsx_runtime_1.jsx)(FeeBadge, { label: "IPTU", amount: property.iptu_value, periodicity: property.iptu_periodicity })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-6 mt-6 text-sm text-gray-600", children: [property.bedrooms > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bed, { className: "h-4 w-4 text-gray-400" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium text-gray-900", children: [property.bedrooms, " quartos"] })] })), property.bathrooms > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bath, { className: "h-4 w-4 text-gray-400" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium text-gray-900", children: [property.bathrooms, " banheiros"] })] })), property.area_m2 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Square, { className: "h-4 w-4 text-gray-400" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium text-gray-900", children: [property.area_m2, "m\u00B2"] })] })), property.parking_spaces > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Car, { className: "h-4 w-4 text-gray-400" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium text-gray-900", children: [property.parking_spaces, " vagas"] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2 pt-4 border-t border-gray-100", children: [(0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-gray-100 text-gray-700 px-3 py-1 text-xs font-medium rounded-md", children: property.property_type }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium rounded-md", children: property.transaction_type === 'sale' ? 'Venda' : 'Aluguel' }), property.is_featured && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-amber-50 text-amber-700 px-3 py-1 text-xs font-medium rounded-md", children: "Destaque" }))] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-lg border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "bg-gray-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex lg:flex-col gap-2 p-4", children: ['Detalhes', 'Características'].map((tab) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveTab(tab), className: `text-sm font-medium rounded-lg px-4 py-2 transition-all duration-200 w-full lg:w-auto ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`, children: tab }, tab))) }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-2 bg-white p-4 sm:p-6", children: [activeTab === 'Detalhes' && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-base font-semibold text-gray-900 mb-3", children: "Descri\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("div", { className: "prose max-w-none text-gray-700", children: property.description ? ((0, jsx_runtime_1.jsx)("p", { className: "whitespace-pre-wrap leading-relaxed text-sm", children: property.description })) : ((0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 italic text-sm", children: "Nenhuma descri\u00E7\u00E3o dispon\u00EDvel." })) })] }), (property.private_area_m2 || property.total_area_m2 || property.suites || property.covered_parking_spaces || property.floor_number || property.total_floors || property.built_year || property.sunlight_orientation || property.property_condition || property.water_cost || property.electricity_cost || property.furnished || property.accepts_pets || property.elevator || property.portaria_24h || property.gas_included || property.accessibility || property.heating_type) && ((0, jsx_runtime_1.jsx)("div", {}))] })), activeTab === 'Características' && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-base font-semibold text-gray-900 mb-3", children: "Caracter\u00EDsticas" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:divide-x lg:divide-gray-200", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 lg:pr-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100", children: "Caracter\u00EDsticas Gerais" }), property.features && property.features.length > 0 && property.features.map((feature, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { children: feature })] }, `feat-${index}`))), property.private_area_m2 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u00C1rea privativa: ", property.private_area_m2, "m\u00B2"] })] })), property.total_area_m2 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u00C1rea total: ", property.total_area_m2, "m\u00B2"] })] })), property.suites != null && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Su\u00EDtes: ", property.suites] })] })), property.covered_parking_spaces != null && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Vagas cobertas: ", property.covered_parking_spaces] })] })), property.floor_number != null && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Andar: ", property.floor_number] })] })), property.total_floors != null && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Total de andares: ", property.total_floors] })] })), property.built_year && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Ano de constru\u00E7\u00E3o: ", property.built_year] })] })), property.sunlight_orientation && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Face do sol: ", property.sunlight_orientation] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 lg:pl-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100", children: "Condi\u00E7\u00F5es & Comodidades" }), property.property_condition && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Condi\u00E7\u00E3o: ", property.property_condition] })] })), property.water_cost != null && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["\u00C1gua: ", formatPrice(property.water_cost)] })] })), property.electricity_cost != null && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Luz: ", formatPrice(property.electricity_cost)] })] })), typeof property.furnished === 'boolean' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Mobiliado: ", property.furnished ? 'Sim' : 'Não'] })] })), typeof property.accepts_pets === 'boolean' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Aceita pets: ", property.accepts_pets ? 'Sim' : 'Não'] })] })), typeof property.elevator === 'boolean' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Elevador: ", property.elevator ? 'Sim' : 'Não'] })] })), typeof property.portaria_24h === 'boolean' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Portaria 24h: ", property.portaria_24h ? 'Sim' : 'Não'] })] })), typeof property.gas_included === 'boolean' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["G\u00E1s incluso: ", property.gas_included ? 'Sim' : 'Não'] })] })), typeof property.accessibility === 'boolean' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Acessibilidade: ", property.accessibility ? 'Sim' : 'Não'] })] })), property.heating_type && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center py-2 text-sm text-gray-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Aquecimento: ", property.heating_type] })] }))] })] }), property.notes && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-gray-500 mb-2 font-medium", children: "Observa\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-700 whitespace-pre-wrap leading-relaxed", children: property.notes })] }))] }))] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4", children: "Localiza\u00E7\u00E3o" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center text-gray-700", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-4 w-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm sm:text-base", children: property.address })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200", children: (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-center text-sm sm:text-base", children: "Mapa da localiza\u00E7\u00E3o em breve" }) })] })] }), similarProperties.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6", children: "Im\u00F3veis Similares" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4", children: similarProperties.slice(0, 4).map((similar) => ((0, jsx_runtime_1.jsxs)("div", { onClick: () => navigate(`/${slug}/${similar.slug}`), className: "bg-gray-50 rounded-lg p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200", children: [(0, jsx_runtime_1.jsx)("div", { className: "aspect-video bg-gray-200 rounded-lg mb-2 sm:mb-3 overflow-hidden", children: similar.main_image_url ? ((0, jsx_runtime_1.jsx)("img", { src: similar.main_image_url, alt: similar.title, className: "w-full h-full object-cover" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full h-full flex items-center justify-center text-gray-400", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Square, { className: "h-6 w-6 sm:h-8 sm:w-8" }) })) }), (0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 text-sm sm:text-base", children: similar.title }), (0, jsx_runtime_1.jsx)("div", { className: "text-gray-900 font-semibold text-base sm:text-lg mb-0.5", children: formatPrice(similar.price) }), typeof similar.hoa_fee === 'number' && (similar.hoa_fee ?? 0) > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "text-[11px] sm:text-xs text-gray-600 mb-1", children: ["Condom\u00EDnio ", formatPrice(similar.hoa_fee), (similar.hoa_periodicity === 'monthly') && ' / mês', (similar.hoa_periodicity === 'annual') && ' / ano'] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center text-gray-600 text-xs sm:text-sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-3 w-3 mr-1 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { className: "truncate", children: [similar.neighborhood, ", ", similar.uf] })] })] }, similar.id))) })] }))] })] }), (0, jsx_runtime_1.jsx)("div", { className: "lg:col-span-1", children: (0, jsx_runtime_1.jsx)("div", { className: "sticky top-20 sm:top-24", children: (0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg shadow-lg border p-4 sm:p-6 space-y-4 transition-colors duration-300 ${isDarkMode
                                                        ? 'bg-gray-800 border-gray-700'
                                                        : 'bg-white border-gray-200'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`, children: "Interessado?" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: "Entre em contato conosco" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: handleWhatsAppClick, className: "w-full py-2 sm:py-3 text-sm sm:text-base font-medium text-white rounded-lg shadow-sm hover:shadow-md transition-shadow", style: {
                                                                        backgroundColor: brokerProfile?.whatsapp_button_color || '#25D366'
                                                                    }, children: [(0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 24 24", className: "h-4 w-4 sm:h-5 sm:w-5 mr-2", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.69" }) }), brokerProfile?.whatsapp_button_text || 'WhatsApp'] }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: handleContactLead, variant: "outline", className: `w-full py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-colors duration-300 ${isDarkMode
                                                                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300 hover:text-white'
                                                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`, children: "Tenho Interesse" }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: handleShare, variant: "outline", className: `w-full py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-colors duration-300 ${isDarkMode
                                                                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300 hover:text-white'
                                                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Share2, { className: "h-4 w-4 mr-2" }), "Compartilhar"] })] }), (0, jsx_runtime_1.jsx)("div", { className: `pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} transition-colors duration-300`, children: (0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between rounded-xl p-4 border transition-colors duration-300 ${isDarkMode
                                                                    ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-600'
                                                                    : 'bg-gradient-to-r from-gray-50/50 to-gray-100/50 border-gray-100'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-2 rounded-lg shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: `h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300` }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: `text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`, children: viewsCount }), (0, jsx_runtime_1.jsx)("div", { className: `text-xs font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`, children: "visualiza\u00E7\u00F5es" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-2 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-green-900/50' : 'bg-green-50'}`, children: (0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: `text-sm font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`, children: "Online" }), (0, jsx_runtime_1.jsx)("div", { className: `text-xs font-medium transition-colors duration-300 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`, children: "dispon\u00EDvel" })] })] })] }) })] }) }) })] }) }), (0, jsx_runtime_1.jsx)(dialog_1.Dialog, { open: isImageModalOpen, onOpenChange: setIsImageModalOpen, children: (0, jsx_runtime_1.jsx)(dialog_1.DialogContent, { className: "max-w-[98vw] max-h-[98vh] w-auto h-auto p-0 bg-black/95 border-0 flex items-center justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative max-w-full max-h-full flex items-center justify-center", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setIsImageModalOpen(false), className: "absolute top-4 right-4 z-10 bg-white/20 text-white p-2 rounded-lg hover:bg-white/30", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-6 w-6" }) }), propertyImages.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "w-[95vw] h-[90vh] md:max-w-[90vw] md:max-h-[85vh] flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(zoomable_image_1.ZoomableImage, { src: propertyImages[currentImageIndex], alt: `${property.title} - Imagem ${currentImageIndex + 1}`, className: "w-full h-full object-contain" }) })), propertyImages.length > 1 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : propertyImages.length - 1), className: "absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-lg hover:bg-white/30", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setCurrentImageIndex(currentImageIndex < propertyImages.length - 1 ? currentImageIndex + 1 : 0), className: "absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-3 rounded-lg hover:bg-white/30", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "h-6 w-6 rotate-180" }) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-lg", children: [currentImageIndex + 1, " de ", propertyImages.length] })] }) }) })] })] }), (0, jsx_runtime_1.jsx)(ContactCTA_1.default, { brokerProfile: brokerProfile }), (0, jsx_runtime_1.jsx)(Footer_1.default, { brokerProfile: brokerProfile, onContactRequest: fetchContactInfo }), (0, jsx_runtime_1.jsx)(LeadModal_1.default, { isOpen: showLeadModal, onClose: () => setShowLeadModal(false), onSuccess: handleLeadSuccess, property: property, brokerProfile: brokerProfile })] }));
};
exports.default = PropertyDetailPage;
