"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const PropertyCard_1 = __importDefault(require("@/components/properties/PropertyCard"));
const button_1 = require("@/components/ui/button");
const BackgroundRenderer_1 = __importDefault(require("@/components/backgrounds/BackgroundRenderer"));
const SectionHeader_1 = __importDefault(require("@/components/common/SectionHeader"));
const PropertiesGrid = ({ properties, brokerProfile, onContactLead, onShare, onFavorite, isFavorited, onImageClick }) => {
    const regularProperties = properties.filter(p => !p.is_featured);
    const [visibleCount, setVisibleCount] = (0, react_1.useState)(12); // Mostrar apenas 12 inicialmente
    const visibleProperties = (0, react_1.useMemo)(() => regularProperties.slice(0, visibleCount), [regularProperties, visibleCount]);
    // Function to ensure specific property is visible
    const ensurePropertyVisible = (propertyId) => {
        const propertyIndex = regularProperties.findIndex(p => p.id === propertyId);
        if (propertyIndex >= 0 && propertyIndex >= visibleCount) {
            logger_1.logger.debug(`Expanding grid to show property ${propertyId} at index ${propertyIndex}`);
            setVisibleCount(Math.ceil((propertyIndex + 1) / 12) * 12);
        }
    };
    // Expose function globally for navigation restoration
    window.ensurePropertyVisible = ensurePropertyVisible;
    const hasMoreProperties = regularProperties.length > visibleCount;
    if (regularProperties.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsx)("section", { id: "todos-imoveis", className: "bg-surface", children: (0, jsx_runtime_1.jsx)(BackgroundRenderer_1.default, { style: brokerProfile?.sections_background_style || 'pro-minimal', color1: brokerProfile?.sections_background_color_1 || brokerProfile?.primary_color || '#2563eb', color2: brokerProfile?.sections_background_color_2 || brokerProfile?.secondary_color || '#64748b', color3: brokerProfile?.sections_background_color_3 || '#ffffff', className: "py-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "content-container", children: [(0, jsx_runtime_1.jsx)(SectionHeader_1.default, { title: "Todos os Im\u00F3veis", subtitle: "Explore nossa sele\u00E7\u00E3o completa de propriedades", className: "mb-8" }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 desktop-grid", children: visibleProperties.map((property) => ((0, jsx_runtime_1.jsx)(PropertyCard_1.default, { id: `property-${property.id}`, property: property, brokerProfile: brokerProfile, onContactLead: onContactLead, onShare: onShare, onFavorite: onFavorite, isFavorited: isFavorited, onImageClick: onImageClick }, property.id))) }), hasMoreProperties && ((0, jsx_runtime_1.jsx)("div", { className: "text-center mt-6 sm:mt-8", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: () => setVisibleCount(prev => prev + 12), className: "px-6 sm:px-8 py-2 text-sm sm:text-base", style: {
                                backgroundColor: brokerProfile?.primary_color || '#2563eb',
                                borderColor: brokerProfile?.primary_color || '#2563eb',
                                color: 'white'
                            }, children: [(0, jsx_runtime_1.jsxs)("span", { className: "hidden sm:inline", children: ["Ver Mais Im\u00F3veis (", regularProperties.length - visibleCount, " restantes)"] }), (0, jsx_runtime_1.jsxs)("span", { className: "sm:hidden", children: ["Ver Mais (", regularProperties.length - visibleCount, ")"] })] }) }))] }) }) }));
};
exports.default = PropertiesGrid;
