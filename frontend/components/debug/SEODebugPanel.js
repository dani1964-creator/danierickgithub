"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEODebugPanel = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const SEODebugPanel = ({ brokerProfile, isVisible = true }) => {
    if (!isVisible || !brokerProfile)
        return null;
    const seoData = {
        site_title: brokerProfile.site_title,
        site_description: brokerProfile.site_description,
        site_favicon_url: brokerProfile.site_favicon_url,
        site_share_image_url: brokerProfile.site_share_image_url,
        business_name: brokerProfile.business_name,
        logo_url: brokerProfile.logo_url,
        website_slug: brokerProfile.website_slug,
    };
    const finalTitle = brokerProfile?.site_title ||
        `${brokerProfile?.business_name || 'Imobiliária'} - Imóveis para Venda e Locação`;
    const finalDescription = brokerProfile?.site_description ||
        `Encontre imóveis com ${brokerProfile?.business_name || 'nossa imobiliária'}.`;
    const finalImage = brokerProfile?.site_share_image_url ?
        (brokerProfile.site_share_image_url.startsWith('http') ?
            brokerProfile.site_share_image_url :
            `${window.location.origin}${brokerProfile.site_share_image_url}`) :
        brokerProfile?.logo_url ?
            (brokerProfile.logo_url.startsWith('http') ?
                brokerProfile.logo_url :
                `${window.location.origin}${brokerProfile.logo_url}`) :
            `${window.location.origin}/placeholder.svg`;
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '400px',
            zIndex: 9999,
            fontFamily: 'monospace'
        }, children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 10px 0', color: '#00ff00' }, children: "\uD83D\uDC1B DEBUG SEO" }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '10px' }, children: [(0, jsx_runtime_1.jsx)("strong", { style: { color: '#ffff00' }, children: "Dados Brutos:" }), (0, jsx_runtime_1.jsx)("pre", { style: {
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '5px',
                            margin: '5px 0',
                            overflow: 'auto',
                            maxHeight: '100px'
                        }, children: JSON.stringify(seoData, null, 2) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '10px' }, children: [(0, jsx_runtime_1.jsx)("strong", { style: { color: '#ffff00' }, children: "Meta Tags Finais:" }), (0, jsx_runtime_1.jsxs)("div", { style: { margin: '5px 0' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Title:" }), " ", finalTitle] }), (0, jsx_runtime_1.jsxs)("div", { style: { margin: '5px 0' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Description:" }), " ", finalDescription] }), (0, jsx_runtime_1.jsxs)("div", { style: { margin: '5px 0' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "OG Image:" }), (0, jsx_runtime_1.jsx)("div", { style: { wordBreak: 'break-all' }, children: finalImage })] })] }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '10px', color: '#ccc' }, children: "Pressione F12 \u2192 Console para mais detalhes" })] }));
};
exports.SEODebugPanel = SEODebugPanel;
