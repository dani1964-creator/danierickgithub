"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const detail_prefetch_1 = require("@/lib/detail-prefetch");
const client_1 = require("@/integrations/supabase/client");
const useDomainAware_1 = require("@/hooks/useDomainAware");
const PropertyCard = ({ id, property, brokerProfile, onContactLead, onShare, onFavorite, isFavorited, onImageClick }) => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { slug } = (0, react_router_dom_1.useParams)();
    const { isCustomDomain, getBrokerByDomainOrSlug } = (0, useDomainAware_1.useDomainAware)();
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(price);
    };
    const propertyImages = property.images && property.images.length > 0
        ? property.images
        : property.main_image_url
            ? [property.main_image_url]
            : [];
    const prefetchDetail = async () => {
        try {
            // Determina o slug efetivo do corretor
            let effectiveSlug = slug;
            if (isCustomDomain() || !effectiveSlug) {
                const broker = await getBrokerByDomainOrSlug(undefined);
                effectiveSlug = broker?.website_slug || effectiveSlug;
            }
            const propertySlug = property.slug || property.id;
            if (!effectiveSlug || !propertySlug)
                return;
            // Busca RPCs em paralelo
            const [propertyResult, brokerResult] = await Promise.all([
                client_1.supabase.rpc('get_public_property_detail_with_realtor', {
                    broker_slug: effectiveSlug,
                    property_slug: propertySlug,
                }),
                client_1.supabase.rpc('get_public_broker_branding', { broker_website_slug: effectiveSlug }),
            ]);
            const { data: propertyArr } = propertyResult;
            const { data: brokerArr } = brokerResult;
            if (propertyArr && propertyArr[0] && brokerArr && brokerArr[0]) {
                (0, detail_prefetch_1.setPrefetchedDetail)(effectiveSlug, propertySlug, {
                    property: propertyArr[0],
                    brokerProfile: brokerArr[0],
                });
            }
        }
        catch (e) {
            // ignora erros de prefetch
        }
    };
    const handleViewDetails = async () => {
        // Dispara prefetch e navega em seguida
        prefetchDetail();
        const propertySlug = property.slug || property.id;
        if (isCustomDomain()) {
            navigate(`/${propertySlug}`);
        }
        else {
            navigate(`/${slug}/${propertySlug}`);
        }
    };
    return ((0, jsx_runtime_1.jsx)(card_1.Card, { id: id, className: "overflow-hidden transition-all duration-300 group hover:shadow-soft-3 hover:scale-[1.02] cursor-pointer bg-background dark:bg-card", onClick: handleViewDetails, onMouseEnter: prefetchDetail, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative w-full aspect-[4/3] flex-shrink-0 overflow-hidden", children: [propertyImages.length > 0 ? ((0, jsx_runtime_1.jsx)("img", { src: propertyImages[0], alt: property.title, className: "w-full h-full object-cover", loading: "lazy" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full h-full bg-gray-200 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-gray-500 text-sm", children: "Sem imagem" }) })), (0, jsx_runtime_1.jsxs)("div", { className: "absolute top-3 left-3 right-3 flex justify-between items-start", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-1.5", children: [property.is_featured && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "text-white border-0 text-xs font-medium px-2 py-0.5 rounded-md", style: { backgroundColor: brokerProfile?.primary_color || '#2563eb' }, children: "Destaque" })), (0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "text-white border-0 text-xs font-medium px-2 py-0.5 rounded-md", style: { backgroundColor: property.transaction_type === 'sale' ? '#10b981' : '#8b5cf6' }, children: property.transaction_type === 'sale' ? 'Venda' : 'Aluguel' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-1.5", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", className: "h-7 w-7 p-0 bg-background/90 border-0 text-muted-foreground hover:bg-background hover:text-red-500 backdrop-blur-sm rounded-lg transition-all duration-200", onClick: (e) => {
                                                e.stopPropagation();
                                                onFavorite(property.id);
                                            }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Heart, { className: `h-3.5 w-3.5 ${isFavorited(property.id) ? 'fill-red-500 text-red-500' : ''}` }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", className: "h-7 w-7 p-0 bg-background/90 border-0 text-muted-foreground hover:bg-background hover:text-primary backdrop-blur-sm rounded-lg transition-all duration-200", onClick: (e) => {
                                                e.stopPropagation();
                                                onShare(property);
                                            }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Share2, { className: "h-3.5 w-3.5" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute bottom-3 left-3 right-3 flex justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center text-muted-foreground text-xs bg-background/90 px-2 py-1 rounded-md backdrop-blur-sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-3 w-3 mr-1" }), (0, jsx_runtime_1.jsx)("span", { children: property.views_count || 0 })] }), propertyImages.length > 1 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-background/90 text-muted-foreground text-xs px-2 py-1 rounded-md backdrop-blur-sm", children: ["+", propertyImages.length - 1, " fotos"] }))] })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-4 space-y-3 flex-1 flex flex-col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-base line-clamp-2 leading-tight text-foreground", children: property.title }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-muted-foreground flex items-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-3 w-3 mr-1 flex-shrink-0" }), (0, jsx_runtime_1.jsxs)("span", { className: "truncate", children: [property.neighborhood, ", ", property.uf] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "py-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-lg font-bold text-foreground", children: formatPrice(property.price) }), property.property_code && ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-muted-foreground mt-0.5", children: ["C\u00F3digo: ", property.property_code] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4 text-xs text-muted-foreground", children: [property.bedrooms > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bed, { className: "h-3 w-3 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-foreground", children: property.bedrooms })] })), property.bathrooms > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bath, { className: "h-3 w-3 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-foreground", children: property.bathrooms })] })), property.parking_spaces > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Car, { className: "h-3 w-3 text-muted-foreground" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-foreground", children: property.parking_spaces })] })), property.area_m2 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Square, { className: "h-3 w-3 text-muted-foreground" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium text-foreground", children: [property.area_m2, "m\u00B2"] })] }))] }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full text-sm font-medium h-10 rounded-lg transition-all duration-200 mt-4", onClick: (e) => {
                                e.stopPropagation();
                                handleViewDetails();
                            }, onMouseEnter: prefetchDetail, onFocus: prefetchDetail, style: {
                                backgroundColor: brokerProfile?.primary_color || '#2563eb',
                                borderColor: brokerProfile?.primary_color || '#2563eb',
                                color: 'white'
                            }, children: "Ver Detalhes Completos" })] })] }) }));
};
exports.default = PropertyCard;
