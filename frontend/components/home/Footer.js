"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const fa_1 = require("react-icons/fa");
const react_2 = require("react");
const Footer = ({ brokerProfile, socialLinks = [], onContactRequest }) => {
    const [contactInfo, setContactInfo] = (0, react_1.useState)(null);
    const [contactRequested, setContactRequested] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    // Function to request contact information when needed
    const handleContactRequest = (0, react_2.useCallback)(async () => {
        if (!contactRequested && !contactInfo) {
            setContactRequested(true);
            const contact = await onContactRequest();
            setContactInfo(contact);
        }
    }, [contactRequested, contactInfo, onContactRequest]);
    // Load contact info when footer is displayed
    (0, react_1.useEffect)(() => {
        handleContactRequest();
    }, [handleContactRequest]);
    // Mapear ícones modernos do React Icons para as plataformas
    const getIconComponentForPlatform = (platform) => {
        switch (platform.toLowerCase()) {
            case 'facebook':
                return fa_1.FaFacebookF;
            case 'instagram':
                return fa_1.FaInstagram;
            case 'twitter':
                return fa_1.FaTwitter;
            case 'linkedin':
                return fa_1.FaLinkedinIn;
            case 'youtube':
                return fa_1.FaYoutube;
            case 'website':
                return fa_1.FaGlobe;
            default:
                return fa_1.FaGlobe;
        }
    };
    const getPlatformColor = (platform) => {
        switch (platform.toLowerCase()) {
            case 'facebook':
                return '#1877F2';
            case 'instagram':
                return '#E4405F';
            case 'linkedin':
                return '#0A66C2';
            case 'twitter':
                return '#1DA1F2';
            case 'youtube':
                return '#FF0000';
            case 'website':
                return brokerProfile?.secondary_color || '#64748b';
            default:
                return brokerProfile?.secondary_color || '#64748b';
        }
    };
    // Formatar número do WhatsApp para exibição
    const formatPhoneForDisplay = (phone) => {
        if (!phone)
            return null;
        // Se o número começa com 55 (código do Brasil), remove para formatação
        const cleanPhone = phone.startsWith('55') ? phone.slice(2) : phone;
        // Formatar como (XX) XXXXX-XXXX
        if (cleanPhone.length === 11) {
            return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
        }
        return phone;
    };
    // Function to handle internal navigation
    const handleInternalNavigation = (path) => {
        navigate(path);
    };
    // Verificar se há informações de contato válidas
    const hasContactInfo = contactInfo?.contact_email || contactInfo?.whatsapp_number;
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]", children: (0, jsx_runtime_1.jsx)("footer", { id: "footer", className: "bg-background dark:bg-card border-t border-gray-100 dark:border-border py-16 w-full", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-6xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "md:col-span-2 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [brokerProfile?.logo_url ? ((0, jsx_runtime_1.jsx)("img", { src: brokerProfile.logo_url, alt: brokerProfile.business_name, className: "w-auto mr-3", style: { height: `${Math.min(brokerProfile.logo_size || 80, 40)}px` } })) : ((0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-lg text-white flex items-center justify-center text-sm font-semibold mr-3", style: { backgroundColor: brokerProfile?.primary_color || '#2563eb' }, children: brokerProfile?.business_name?.charAt(0) || 'I' })), (0, jsx_runtime_1.jsx)("span", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: brokerProfile?.business_name || 'Imobiliária' })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-md", children: brokerProfile?.about_text || 'Oferecemos os melhores imóveis da região com atendimento personalizado e especializado.' }), socialLinks.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "flex space-x-3 pt-2", children: socialLinks.map((social) => {
                                                const IconComponent = getIconComponentForPlatform(social.platform);
                                                const iconColor = getPlatformColor(social.platform);
                                                return ((0, jsx_runtime_1.jsx)("a", { href: social.url, target: "_blank", rel: "noopener noreferrer", className: "w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105", "aria-label": social.platform, children: (0, jsx_runtime_1.jsx)(IconComponent, { className: "w-4 h-4", style: { color: iconColor } }) }, social.id));
                                            }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: "Contato" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [brokerProfile?.display_name && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: brokerProfile.display_name }), contactInfo?.creci && ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: ["CRECI: ", contactInfo.creci] }))] })), contactInfo?.whatsapp_number && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3.5 w-3.5 text-gray-400 dark:text-gray-500" }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-900 dark:text-gray-200", children: formatPhoneForDisplay(contactInfo.whatsapp_number) }) })] })), contactInfo?.contact_email && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-3.5 w-3.5 text-gray-400 dark:text-gray-500" }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-900 dark:text-gray-200", children: contactInfo.contact_email }) })] })), brokerProfile?.address && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mt-0.5" }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-900 dark:text-gray-200 leading-relaxed", children: brokerProfile.address }) })] })), !hasContactInfo && contactRequested && ((0, jsx_runtime_1.jsx)("div", { className: "p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-amber-800 dark:text-amber-200 text-xs", children: "Configure suas informa\u00E7\u00F5es de contato" }) }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: "Links \u00DAteis" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleInternalNavigation(`/${brokerProfile?.website_slug || ''}/sobre-nos`), className: "block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors", children: "Sobre N\u00F3s" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleInternalNavigation(`/${brokerProfile?.website_slug || ''}/politica-de-privacidade`), className: "block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors", children: "Pol\u00EDtica de Privacidade" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleInternalNavigation(`/${brokerProfile?.website_slug || ''}/termos-de-uso`), className: "block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors", children: "Termos de Uso" })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "border-t border-gray-100 dark:border-gray-700 mt-12 pt-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center md:text-left", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 dark:text-gray-300 text-sm", children: brokerProfile?.footer_text || 'Todos os direitos reservados' }), brokerProfile?.cnpj && ((0, jsx_runtime_1.jsxs)("p", { className: "text-gray-500 dark:text-gray-400 text-xs mt-1", children: ["CNPJ: ", brokerProfile.cnpj] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "text-center md:text-right", children: (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 dark:text-gray-400 text-xs", children: (0, jsx_runtime_1.jsx)("a", { href: "https://linkme.bio/danierickp", target: "_blank", rel: "noopener noreferrer", className: "hover:text-gray-700 dark:hover:text-gray-200 transition-colors", children: "Desenvolvido por DEPS" }) }) })] }) })] }) }) }) }));
};
exports.default = Footer;
