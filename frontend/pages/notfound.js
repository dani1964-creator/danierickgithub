"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const NotFound = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        logger_1.logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-background animate-fade-in px-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center space-y-6 max-w-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-6xl sm:text-7xl font-bold text-foreground tracking-tight", children: "404" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xl sm:text-2xl font-semibold text-foreground", children: "P\u00E1gina n\u00E3o encontrada" }), (0, jsx_runtime_1.jsx)("p", { className: "text-base text-muted-foreground leading-relaxed", children: "A p\u00E1gina que voc\u00EA est\u00E1 procurando n\u00E3o existe ou foi movida." })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => navigate('/'), className: "inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2", children: "Voltar ao in\u00EDcio" })] }) }));
};
exports.default = NotFound;
