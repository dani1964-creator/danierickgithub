"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const toaster_1 = require("@/components/ui/toaster");
const sonner_1 = require("@/components/ui/sonner");
const tooltip_1 = require("@/components/ui/tooltip");
const react_query_1 = require("@tanstack/react-query");
const react_router_dom_1 = require("react-router-dom");
const PersistentLayout_1 = require("@/components/layout/PersistentLayout");
const sidebar_1 = require("@/components/ui/sidebar");
const react_helmet_async_1 = require("react-helmet-async");
const DomainRouteHandler_1 = require("@/components/layout/DomainRouteHandler");
const Dashboard_1 = __importDefault(require("./pages/Dashboard"));
const Properties_1 = __importDefault(require("./pages/Properties"));
const Settings_1 = __importDefault(require("./pages/Settings"));
const WebsiteSettings_1 = __importDefault(require("./pages/WebsiteSettings"));
const Leads_1 = __importDefault(require("./pages/Leads"));
const Realtors_1 = __importDefault(require("./pages/Realtors"));
const NotFound_1 = __importDefault(require("./pages/NotFound"));
const PublicSite_1 = __importDefault(require("./pages/PublicSite"));
const SuperAdmin_1 = __importDefault(require("./pages/SuperAdmin"));
const AboutUs_1 = __importDefault(require("./pages/AboutUs"));
const PrivacyPolicy_1 = __importDefault(require("./pages/PrivacyPolicy"));
const TermsOfUse_1 = __importDefault(require("./pages/TermsOfUse"));
const queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            refetchOnMount: 'always',
            retry: (failureCount, error) => {
                const status = error?.status;
                if (typeof status === 'number') {
                    if (status === 404 || status === 401 || status === 403) {
                        return false;
                    }
                }
                return failureCount < 2;
            },
        },
    },
});
const RootLayout = () => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.ScrollRestoration, { getKey: (location, matches) => {
                // Para navegação PUSH (nova página), manter scroll atual
                // Para navegação POP (voltar), restaurar posição salva
                return location.key;
            } }), (0, jsx_runtime_1.jsx)(PersistentLayout_1.PersistentLayout, {})] }));
const router = (0, react_router_dom_1.createBrowserRouter)([
    {
        path: "/",
        element: (0, jsx_runtime_1.jsx)(RootLayout, {}),
        children: [
            {
                index: true,
                element: (0, jsx_runtime_1.jsx)(DomainRouteHandler_1.DomainRouteHandler, {})
            },
            {
                path: "dashboard",
                element: (0, jsx_runtime_1.jsx)(Dashboard_1.default, {})
            },
            {
                path: "auth",
                element: (0, jsx_runtime_1.jsx)(DomainRouteHandler_1.DomainRouteHandler, {})
            },
            {
                path: "dashboard/home",
                element: (0, jsx_runtime_1.jsx)(Dashboard_1.default, {})
            },
            {
                path: "dashboard/properties",
                element: (0, jsx_runtime_1.jsx)(Properties_1.default, {})
            },
            {
                path: "dashboard/settings",
                element: (0, jsx_runtime_1.jsx)(Settings_1.default, {})
            },
            {
                path: "dashboard/website",
                element: (0, jsx_runtime_1.jsx)(WebsiteSettings_1.default, {})
            },
            {
                path: "dashboard/leads",
                element: (0, jsx_runtime_1.jsx)(Leads_1.default, {})
            },
            {
                path: "dashboard/realtors",
                element: (0, jsx_runtime_1.jsx)(Realtors_1.default, {})
            },
            {
                path: "admin",
                element: (0, jsx_runtime_1.jsx)(SuperAdmin_1.default, {})
            },
            // Rotas públicas por slug
            {
                path: ":slug",
                element: (0, jsx_runtime_1.jsx)(PublicSite_1.default, {})
            },
            {
                path: ":slug/:propertySlug",
                element: (0, jsx_runtime_1.jsx)(PublicSite_1.default, {})
            },
            {
                path: ":slug/sobre-nos",
                element: (0, jsx_runtime_1.jsx)(AboutUs_1.default, {})
            },
            {
                path: ":slug/politica-de-privacidade",
                element: (0, jsx_runtime_1.jsx)(PrivacyPolicy_1.default, {})
            },
            {
                path: ":slug/termos-de-uso",
                element: (0, jsx_runtime_1.jsx)(TermsOfUse_1.default, {})
            },
            // Catch-all routes for custom domains (property slugs without broker slug)
            {
                path: "sobre-nos",
                element: (0, jsx_runtime_1.jsx)(AboutUs_1.default, {})
            },
            {
                path: "politica-de-privacidade",
                element: (0, jsx_runtime_1.jsx)(PrivacyPolicy_1.default, {})
            },
            {
                path: "termos-de-uso",
                element: (0, jsx_runtime_1.jsx)(TermsOfUse_1.default, {})
            },
            {
                path: "404",
                element: (0, jsx_runtime_1.jsx)(NotFound_1.default, {})
            },
            {
                path: "*",
                element: (0, jsx_runtime_1.jsx)(DomainRouteHandler_1.DomainRouteHandler, {})
            }
        ]
    }
]);
const App = () => ((0, jsx_runtime_1.jsx)(react_helmet_async_1.HelmetProvider, { children: (0, jsx_runtime_1.jsx)(react_query_1.QueryClientProvider, { client: queryClient, children: (0, jsx_runtime_1.jsx)(tooltip_1.TooltipProvider, { children: (0, jsx_runtime_1.jsxs)(sidebar_1.SidebarProvider, { children: [(0, jsx_runtime_1.jsx)(toaster_1.Toaster, {}), (0, jsx_runtime_1.jsx)(sonner_1.Toaster, {}), (0, jsx_runtime_1.jsx)(react_router_dom_1.RouterProvider, { router: router })] }) }) }) }));
exports.default = App;
