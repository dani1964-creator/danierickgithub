"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const FixedHeader = ({ brokerProfile }) => {
    const [isScrolled, setIsScrolled] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const displayName = brokerProfile.business_name;
    // Function to handle navigation to home
    const handleGoToHome = () => {
        const homeUrl = `/${brokerProfile.website_slug || ''}`;
        navigate(homeUrl);
    };
    return ((0, jsx_runtime_1.jsx)("header", { id: "header", className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-md shadow-lg' : 'backdrop-blur-sm'}`, style: {
            backgroundColor: isScrolled
                ? `${brokerProfile.primary_color || '#2563eb'}15`
                : `${brokerProfile.primary_color || '#2563eb'}10`
        }, children: (0, jsx_runtime_1.jsx)("div", { className: "content-container px-4", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-start h-14 sm:h-16 md:h-20", children: (0, jsx_runtime_1.jsxs)("button", { onClick: handleGoToHome, className: "flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0", "aria-label": "Voltar ao in\u00EDcio", children: [brokerProfile.logo_url && ((0, jsx_runtime_1.jsx)("div", { className: "flex-shrink-0", children: (0, jsx_runtime_1.jsx)("img", { src: brokerProfile.logo_url, alt: `Logo ${displayName}`, className: "object-contain rounded-md", style: {
                                    height: `${Math.min(brokerProfile.logo_size || 80, 60)}px`,
                                    width: 'auto'
                                }, onError: (e) => {
                                    e.currentTarget.style.display = 'none';
                                } }) })), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col min-w-0", children: (0, jsx_runtime_1.jsx)("h1", { className: "text-base sm:text-lg md:text-xl font-bold tracking-tight truncate", style: { color: brokerProfile.primary_color || '#2563eb' }, children: displayName }) })] }) }) }) }));
};
exports.default = FixedHeader;
