"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const swipeable_carousel_1 = require("@/components/ui/swipeable-carousel");
const PropertyCard_1 = __importDefault(require("@/components/properties/PropertyCard"));
const BackgroundRenderer_1 = __importDefault(require("@/components/backgrounds/BackgroundRenderer"));
const SectionHeader_1 = __importDefault(require("@/components/common/SectionHeader"));
const FeaturedProperties = ({ properties, brokerProfile, onContactLead, onShare, onFavorite, isFavorited, onImageClick }) => {
    // Filter featured properties (for now show all since we don't have is_featured field)
    const featuredProperties = properties.slice(0, 8);
    if (featuredProperties.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)("section", { id: "imoveis-destaque", className: "bg-surface", children: (0, jsx_runtime_1.jsx)(BackgroundRenderer_1.default, { style: brokerProfile?.sections_background_style || 'pro-minimal', color1: brokerProfile?.sections_background_color_1 || brokerProfile?.primary_color || '#2563eb', color2: brokerProfile?.sections_background_color_2 || brokerProfile?.secondary_color || '#64748b', color3: brokerProfile?.sections_background_color_3 || '#ffffff', className: "py-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "content-container", children: [(0, jsx_runtime_1.jsx)(SectionHeader_1.default, { title: "Im\u00F3veis em Destaque", subtitle: "Propriedades selecionadas especialmente para voc\u00EA", className: "mb-8" }), (0, jsx_runtime_1.jsx)(swipeable_carousel_1.SwipeableCarousel, { autoplay: true, autoplayDelay: 5000, children: featuredProperties.map((property) => ((0, jsx_runtime_1.jsx)("div", { className: "flex-none w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 px-1 sm:px-2", children: (0, jsx_runtime_1.jsx)(PropertyCard_1.default, { id: `property-featured-${property.id}`, property: property, brokerProfile: brokerProfile, onContactLead: onContactLead, onShare: onShare, onFavorite: onFavorite, isFavorited: isFavorited, onImageClick: onImageClick }) }, property.id))) })] }) }) }));
};
exports.default = FeaturedProperties;
