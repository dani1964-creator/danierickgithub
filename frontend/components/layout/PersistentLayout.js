"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentLayout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const page_transition_1 = require("@/components/ui/page-transition");
const PersistentLayout = ({ children }) => {
    const location = (0, react_router_dom_1.useLocation)();
    // Check if we're on a dashboard route
    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-background", children: (0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-background", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center animate-fade-in", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-muted-foreground", children: "Carregando..." })] }) }), children: (0, jsx_runtime_1.jsx)(page_transition_1.PageTransition, { children: children || (0, jsx_runtime_1.jsx)(react_router_dom_1.Outlet, {}) }) }) }));
};
exports.PersistentLayout = PersistentLayout;
