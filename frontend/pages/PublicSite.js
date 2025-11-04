"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const react_helmet_async_1 = require("react-helmet-async");
const client_1 = require("@/integrations/supabase/client");
const use_toast_1 = require("@/hooks/use-toast");
const usePropertyFilters_1 = require("@/hooks/usePropertyFilters");
const loading_skeleton_1 = require("@/components/ui/loading-skeleton");
const HeroBanner_1 = __importDefault(require("@/components/home/HeroBanner"));
const SearchFilters_1 = __importDefault(require("@/components/home/SearchFilters"));
const FeaturedProperties_1 = __importDefault(require("@/components/home/FeaturedProperties"));
const PropertiesGrid_1 = __importDefault(require("@/components/home/PropertiesGrid"));
const ContactCTA_1 = __importDefault(require("@/components/home/ContactCTA"));
const Footer_1 = __importDefault(require("@/components/home/Footer"));
const WhatsAppFloat_1 = __importDefault(require("@/components/home/WhatsAppFloat"));
const FixedHeader_1 = __importDefault(require("@/components/home/FixedHeader"));
const TrackingScripts_1 = __importDefault(require("@/components/tracking/TrackingScripts"));
const PropertyDetailPage_1 = __importDefault(require("@/components/properties/PropertyDetailPage"));
const LeadModal_1 = __importDefault(require("@/components/leads/LeadModal"));
const separator_1 = require("@/components/ui/separator");
const ThemeProvider_1 = require("@/theme/ThemeProvider");
const useDomainAware_1 = require("@/hooks/useDomainAware");
const seo_1 = require("@/lib/seo");
const usePropertyTypes_1 = require("@/hooks/usePropertyTypes");
const utils_1 = require("@/lib/utils");
const logger_1 = require("@/lib/logger");
// BrokerContact importado do tipo compartilhado
const PublicSite = () => {
    // Função para buscar contato do corretor
    const [properties, setProperties] = (0, react_1.useState)([]);
    const [brokerProfile, setBrokerProfile] = (0, react_1.useState)(null);
    const [brokerContact, setBrokerContact] = (0, react_1.useState)(null);
    const [socialLinks, setSocialLinks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [favorites, setFavorites] = (0, react_1.useState)([]);
    const [lightboxImages, setLightboxImages] = (0, react_1.useState)([]);
    const [lightboxIndex, setLightboxIndex] = (0, react_1.useState)(0);
    const [lightboxOpen, setLightboxOpen] = (0, react_1.useState)(false);
    const [lightboxTitle, setLightboxTitle] = (0, react_1.useState)('');
    const [showWelcomeModal, setShowWelcomeModal] = (0, react_1.useState)(false);
    // Colocar slug/toast cedo para serem capturados nos callbacks abaixo
    const { slug, propertySlug } = (0, react_router_dom_1.useParams)();
    const { toast } = (0, use_toast_1.useToast)();
    const fetchContactInfo = (0, react_1.useCallback)(async () => {
        try {
            logger_1.logger.debug('Fetching contact info for:', brokerProfile?.website_slug);
            const { data, error } = await client_1.supabase.rpc('get_public_broker_contact', {
                broker_website_slug: brokerProfile?.website_slug
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
    }, [brokerProfile?.website_slug]);
    // Função para contato de lead
    const handleContactLead = async (propertyId) => {
        logger_1.logger.debug('Contact lead for property:', propertyId);
        if (!brokerContact) {
            await fetchContactInfo();
        }
        // handled by SecureContactForm
    };
    // Função para compartilhar imóvel
    const handleShare = (0, react_1.useCallback)((property) => {
        if (!brokerProfile)
            return;
        // Compartilhar usando URL direta baseada no slug do corretor e do imóvel
        const brokerSlug = brokerProfile.website_slug;
        const shareUrl = `${window.location.origin}/${brokerSlug}/${property.slug || property.id}`;
        if (navigator.share) {
            navigator.share({
                title: `${property.title} - ${brokerProfile?.business_name}`,
                text: `Confira este imóvel: ${property.title} por ${property.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                url: shareUrl
            });
        }
        else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Confira este imóvel: ${property.title} por ${property.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n${shareUrl}?t=${Date.now()}`)}`;
            if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
                window.open(whatsappUrl, '_blank');
            }
            else {
                navigator.clipboard.writeText(shareUrl);
                toast({
                    title: "Link copiado!",
                    description: "O link do imóvel foi copiado para a área de transferência."
                });
            }
        }
    }, [brokerProfile, toast]);
    // Função para favoritar imóvel
    const handleFavorite = (0, react_1.useCallback)((propertyId) => {
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
    const isFavorited = (propertyId) => favorites.includes(propertyId);
    // Função para abrir galeria de imagens
    const handleImageClick = (0, react_1.useCallback)((images, index, title) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxTitle(title);
        setLightboxOpen(true);
    }, []);
    // Função para sucesso no modal de boas-vindas
    const handleWelcomeModalSuccess = (0, react_1.useCallback)(() => {
        setShowWelcomeModal(false);
        if (slug) {
            localStorage.setItem(`lead-submitted-${slug}`, 'true');
        }
        toast({
            title: "Cadastro realizado!",
            description: "Entraremos em contato em breve.",
        });
    }, [slug, toast]);
    const { getBrokerByDomainOrSlug, getPropertiesByDomainOrSlug, isCustomDomain } = (0, useDomainAware_1.useDomainAware)();
    const { searchTerm, setSearchTerm, filters, setFilters, featuredProperties, regularProperties, hasActiveFilters } = (0, usePropertyFilters_1.usePropertyFilters)(properties);
    // Carrega tipos globais ativos para popular o filtro público
    const { groups: typeGroups } = (0, usePropertyTypes_1.usePropertyTypes)();
    const rankGroup = (label) => {
        const l = (label || '').toLowerCase();
        if (l.includes('residenciais'))
            return 0;
        if (l.includes('comerciais'))
            return 1; // "Comerciais / Empresariais"
        return 10; // demais grupos
    };
    const sortedTypeGroups = (0, react_1.useMemo)(() => {
        return (typeGroups || []).slice().sort((a, b) => {
            const ra = rankGroup(a.label);
            const rb = rankGroup(b.label);
            if (ra !== rb)
                return ra - rb;
            return a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });
        });
    }, [typeGroups]);
    const propertyTypeOptions = (0, react_1.useMemo)(() => sortedTypeGroups.flatMap((g) => g.options.map(o => ({ value: o.value, label: o.label }))), [sortedTypeGroups]);
    const fetchBrokerData = (0, react_1.useCallback)(async () => {
        try {
            const effectiveSlug = isCustomDomain() ? undefined : slug;
            logger_1.logger.debug('Fetching broker data - Custom domain:', isCustomDomain(), 'Slug:', effectiveSlug);
            const brokerData = await getBrokerByDomainOrSlug(effectiveSlug);
            logger_1.logger.debug('Broker data from domain-aware hook:', brokerData);
            if (!brokerData) {
                logger_1.logger.warn('No broker found for slug/domain:', effectiveSlug);
                setBrokerProfile(null);
                return;
            }
            // Converte brokerData para BrokerProfile (Row) com cast via unknown para evitar conflito de tipos gerados
            setBrokerProfile(brokerData);
            const propertiesData = await getPropertiesByDomainOrSlug(effectiveSlug, 50, 0);
            setProperties((propertiesData || []));
            const { data: socialLinksData, error: socialError } = await client_1.supabase
                .from('social_links')
                .select('*')
                .eq('broker_id', brokerData.id)
                .eq('is_active', true)
                .order('display_order');
            if (!socialError) {
                setSocialLinks((socialLinksData || []));
            }
        }
        catch (error) {
            logger_1.logger.error('Error fetching data:', error);
            toast({
                title: 'Erro ao carregar dados',
                description: (0, utils_1.getErrorMessage)(error),
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    }, [getBrokerByDomainOrSlug, getPropertiesByDomainOrSlug, isCustomDomain, slug, toast]);
    (0, react_1.useEffect)(() => {
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
    }, [slug, fetchBrokerData, isCustomDomain]);
    // Fetch contact info when broker profile is loaded
    (0, react_1.useEffect)(() => {
        if (brokerProfile?.website_slug) {
            logger_1.logger.info('Broker profile loaded, fetching contact info...');
            fetchContactInfo();
        }
    }, [brokerProfile?.website_slug, fetchContactInfo]);
    // removed duplicate fetchBrokerData
    // duplicatas removidas (definições acima já existem)
    if (loading) {
        return (0, jsx_runtime_1.jsx)(loading_skeleton_1.PublicSiteSkeleton, {});
    }
    if (!brokerProfile) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center w-full", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold text-gray-900 mb-4", children: "P\u00E1gina n\u00E3o encontrada" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-600 mb-4", children: ["O site \"", slug, "\" n\u00E3o foi encontrado ou n\u00E3o est\u00E1 dispon\u00EDvel."] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Verifique se o URL est\u00E1 correto ou entre em contato com o propriet\u00E1rio do site." })] }) }));
    }
    // Se há um propertySlug na URL, mostrar página de detalhes
    if (propertySlug) {
        return (0, jsx_runtime_1.jsx)(PropertyDetailPage_1.default, {});
    }
    return ((0, jsx_runtime_1.jsxs)(ThemeProvider_1.ThemeProvider, { broker: brokerProfile, children: [(0, jsx_runtime_1.jsxs)(react_helmet_async_1.Helmet, { children: [(0, jsx_runtime_1.jsx)("title", { children: (0, seo_1.applyTemplate)(brokerProfile?.home_title_template, {
                            business_name: brokerProfile?.business_name || 'Imobiliária',
                            properties_count: String(properties?.length || 0)
                        }) || (brokerProfile?.site_title || `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação`) }), (0, jsx_runtime_1.jsx)("meta", { name: "description", content: (0, seo_1.applyTemplate)(brokerProfile?.home_description_template, {
                            business_name: brokerProfile?.business_name || 'Imobiliária',
                            properties_count: String(properties?.length || 0)
                        }) || (brokerProfile?.site_description || `Encontre imóveis com ${brokerProfile?.business_name || 'nossa imobiliária'}. ${properties.length} propriedades disponíveis para venda e locação.`) }), brokerProfile?.site_favicon_url && ((0, jsx_runtime_1.jsx)("link", { rel: "icon", href: brokerProfile.site_favicon_url.startsWith('http') ?
                            brokerProfile.site_favicon_url :
                            `${window.location.origin}${brokerProfile.site_favicon_url}`, type: "image/png" })), (0, jsx_runtime_1.jsx)("meta", { property: "og:title", content: brokerProfile?.site_title ||
                            `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação` }), (0, jsx_runtime_1.jsx)("meta", { property: "og:description", content: brokerProfile?.site_description ||
                            `Encontre seu imóvel dos sonhos com ${brokerProfile?.business_name || 'nossa imobiliária'}. ${properties.length} propriedades disponíveis.` }), (0, jsx_runtime_1.jsx)("meta", { property: "og:image", content: brokerProfile?.site_share_image_url ?
                            (brokerProfile.site_share_image_url.startsWith('http') ?
                                brokerProfile.site_share_image_url :
                                `${window.location.origin}${brokerProfile.site_share_image_url}`) :
                            brokerProfile?.logo_url ?
                                (brokerProfile.logo_url.startsWith('http') ?
                                    brokerProfile.logo_url :
                                    `${window.location.origin}${brokerProfile.logo_url}`) :
                                `${window.location.origin}/placeholder.svg` }), (0, jsx_runtime_1.jsx)("meta", { property: "og:type", content: "website" }), (0, jsx_runtime_1.jsx)("meta", { property: "og:site_name", content: brokerProfile?.business_name || 'Imobiliária' }), (0, jsx_runtime_1.jsx)("meta", { property: "og:url", content: window.location.href }), (0, jsx_runtime_1.jsx)("meta", { property: "og:image:width", content: "1200" }), (0, jsx_runtime_1.jsx)("meta", { property: "og:image:height", content: "630" }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:card", content: "summary_large_image" }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:title", content: brokerProfile?.site_title ||
                            `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação` }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:description", content: brokerProfile?.site_description ||
                            `Encontre seu imóvel dos sonhos com ${brokerProfile?.business_name || 'nossa imobiliária'}. ${properties.length} propriedades disponíveis.` }), (0, jsx_runtime_1.jsx)("meta", { name: "twitter:image", content: brokerProfile?.site_share_image_url ?
                            (brokerProfile.site_share_image_url.startsWith('http') ?
                                brokerProfile.site_share_image_url :
                                `${window.location.origin}${brokerProfile.site_share_image_url}`) :
                            brokerProfile?.logo_url ?
                                (brokerProfile.logo_url.startsWith('http') ?
                                    brokerProfile.logo_url :
                                    `${window.location.origin}${brokerProfile.logo_url}`) :
                                `${window.location.origin}/placeholder.svg` }), (0, jsx_runtime_1.jsx)("link", { rel: "canonical", href: (0, seo_1.getCanonicalBase)(brokerProfile, window.location.origin) }), (0, jsx_runtime_1.jsx)("meta", { name: "robots", content: `${(brokerProfile?.robots_index ?? true) ? 'index' : 'noindex'}, ${(brokerProfile?.robots_follow ?? true) ? 'follow' : 'nofollow'}` }), (0, jsx_runtime_1.jsx)("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }), (0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", children: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'RealEstateAgent',
                            name: brokerProfile?.business_name || brokerProfile?.display_name || 'Imobiliária',
                            url: typeof window !== 'undefined' ? window.location.href : undefined,
                            logo: brokerProfile?.logo_url
                                ? (brokerProfile.logo_url.startsWith('http')
                                    ? brokerProfile.logo_url
                                    : `${typeof window !== 'undefined' ? window.location.origin : ''}${brokerProfile.logo_url}`)
                                : undefined,
                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "public-site-layout min-h-screen bg-background", children: [(0, jsx_runtime_1.jsx)(TrackingScripts_1.default, { trackingScripts: brokerProfile?.tracking_scripts }), (0, jsx_runtime_1.jsx)(FixedHeader_1.default, { brokerProfile: brokerProfile }), (0, jsx_runtime_1.jsx)(HeroBanner_1.default, { brokerProfile: brokerProfile }), (0, jsx_runtime_1.jsx)("div", { id: "search", className: "w-full py-8", children: (0, jsx_runtime_1.jsx)("div", { className: "content-container", children: (0, jsx_runtime_1.jsx)(SearchFilters_1.default, { searchTerm: searchTerm, setSearchTerm: setSearchTerm, filters: filters, setFilters: setFilters, hasActiveFilters: hasActiveFilters, primaryColor: brokerProfile?.primary_color || '#2563eb', secondaryColor: brokerProfile?.secondary_color || '#64748b', propertyTypeOptions: propertyTypeOptions, propertyTypeGroups: sortedTypeGroups.map(g => ({ label: g.label, options: g.options.map(o => ({ value: o.value, label: o.label })) })) }) }) }), featuredProperties.length > 0 && ((0, jsx_runtime_1.jsx)(FeaturedProperties_1.default, { properties: featuredProperties, brokerProfile: brokerProfile, onContactLead: handleContactLead, onShare: handleShare, onFavorite: handleFavorite, isFavorited: isFavorited, onImageClick: handleImageClick })), featuredProperties.length > 0 && regularProperties.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "content-container py-8", children: (0, jsx_runtime_1.jsx)(separator_1.Separator, { className: "bg-black/20" }) })), regularProperties.length > 0 && ((0, jsx_runtime_1.jsx)(PropertiesGrid_1.default, { properties: regularProperties, brokerProfile: brokerProfile, onContactLead: handleContactLead, onShare: handleShare, onFavorite: handleFavorite, isFavorited: isFavorited, onImageClick: handleImageClick })), (0, jsx_runtime_1.jsx)(WhatsAppFloat_1.default, { brokerProfile: brokerProfile, onContactRequest: fetchContactInfo })] }), properties.length > 0 && ((0, jsx_runtime_1.jsx)(ContactCTA_1.default, { brokerProfile: brokerProfile })), (0, jsx_runtime_1.jsx)(Footer_1.default, { brokerProfile: brokerProfile, socialLinks: socialLinks, onContactRequest: fetchContactInfo }), (0, jsx_runtime_1.jsx)(LeadModal_1.default, { isOpen: showWelcomeModal, onClose: () => setShowWelcomeModal(false), onSuccess: handleWelcomeModalSuccess, brokerProfile: brokerProfile, source: "welcome_modal" })] }));
};
exports.default = PublicSite;
