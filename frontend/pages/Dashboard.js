"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const useAuth_1 = require("@/hooks/useAuth");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const client_1 = require("@/integrations/supabase/client");
const DashboardLayout_1 = __importDefault(require("@/components/dashboard/DashboardLayout"));
// ✅ IMPORT DO HOOK OTIMIZADO
const useDashboardData_1 = require("@/hooks/useDashboardData");
const logger_1 = require("@/lib/logger");
const Dashboard = () => {
    const { user, signOut, loading } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [websiteSlug, setWebsiteSlug] = (0, react_1.useState)(null);
    const [brokerId, setBrokerId] = (0, react_1.useState)(null);
    const [customDomain, setCustomDomain] = (0, react_1.useState)(null);
    // ✅ HOOK OTIMIZADO - SUBSTITUI TODAS AS CONSULTAS PESADAS
    const { data: dashboardStats, loading: dashboardLoading, error: dashboardError, lastUpdated, refresh: refreshDashboard } = (0, useDashboardData_1.useDashboardData)(brokerId || '', {
        enableCache: true,
        cacheTTL: 15, // 15 minutos de cache
        enableRealtime: true, // Realtime otimizado
        logQueries: true
    });
    const fetchBrokerProfile = (0, react_1.useCallback)(async (currentUser) => {
        if (!currentUser?.id) {
            return;
        }
        try {
            const { data, error } = await client_1.supabase
                .from('brokers')
                .select('id, website_slug, custom_domain') // buscar id, slug e domínio personalizado
                .eq('user_id', currentUser.id)
                .maybeSingle();
            if (error)
                throw error;
            // ✅ SETAR ID DO BROKER PARA ATIVAR O HOOK
            setBrokerId(data?.id || null);
            setWebsiteSlug(data?.website_slug || null);
            setCustomDomain(data?.custom_domain || null);
        }
        catch (error) {
            logger_1.logger.error('Error fetching broker profile:', error);
        }
    }, [setBrokerId, setWebsiteSlug, setCustomDomain]);
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchBrokerProfile(user);
            // ✅ REALTIME AGORA É GERENCIADO PELO useDashboardData hook automaticamente
        }
    }, [user]); // Precisa depender do user para executar quando ele estiver disponível
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 sm:h-8 w-32 sm:w-48 bg-muted rounded-md animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-24 sm:w-32 bg-muted rounded-md animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({ length: 3 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-sm border p-4 sm:p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-5 w-5 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-20 sm:w-24 bg-muted rounded animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-6 sm:h-8 w-12 sm:w-16 bg-muted rounded animate-pulse mt-2" }), (0, jsx_runtime_1.jsx)("div", { className: "h-3 w-16 sm:w-20 bg-muted rounded animate-pulse mt-1" })] }, i))) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 w-32 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", children: Array.from({ length: 4 }).map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: "h-20 sm:h-24 bg-muted rounded animate-pulse" }, i))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-sm border p-4 sm:p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 w-32 bg-muted rounded animate-pulse mb-4" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-6 h-6 bg-muted rounded-full animate-pulse flex-shrink-0" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 flex-1 bg-muted rounded animate-pulse" })] }, i))) })] })] }) }));
    }
    if (!user) {
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/auth", replace: true });
    }
    if (dashboardLoading) {
        return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 sm:h-8 w-32 sm:w-48 bg-muted rounded-md animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-24 sm:w-32 bg-muted rounded-md animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({ length: 3 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-sm border p-4 sm:p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-5 w-5 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-20 sm:w-24 bg-muted rounded animate-pulse" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-6 sm:h-8 w-12 sm:w-16 bg-muted rounded animate-pulse mt-2" }), (0, jsx_runtime_1.jsx)("div", { className: "h-3 w-16 sm:w-20 bg-muted rounded animate-pulse mt-1" })] }, i))) }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 w-32 bg-muted rounded animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", children: Array.from({ length: 4 }).map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: "h-20 sm:h-24 bg-muted rounded animate-pulse" }, i))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-card rounded-lg shadow-sm border p-4 sm:p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-6 w-32 bg-muted rounded animate-pulse mb-4" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-6 h-6 bg-muted rounded-full animate-pulse flex-shrink-0" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 flex-1 bg-muted rounded animate-pulse" })] }, i))) })] })] }) }));
    }
    if (!user) {
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/auth", replace: true });
    }
    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast({
                title: "Erro ao sair",
                description: error.message,
                variant: "destructive"
            });
        }
        else {
            toast({
                title: "Logout realizado com sucesso!"
            });
        }
    };
    const handleViewPublicSite = () => {
        // Prioridade: domínio personalizado -> subdomínio -> path
        if (customDomain) {
            const hasProtocol = customDomain.startsWith('http://') || customDomain.startsWith('https://');
            const url = hasProtocol ? customDomain : `https://${customDomain}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        if (websiteSlug) {
            // usar subdomínio padrão
            const url = `https://${websiteSlug}.adminimobiliaria.site`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        else {
            toast({
                title: "URL não configurada",
                description: "Configure sua URL nas configurações do site primeiro.",
                variant: "destructive"
            });
        }
    };
    const handleViewDashboardSite = () => {
        // Abre o painel via subdomínio painel.{slug}.adminimobiliaria.site
        if (websiteSlug) {
            const url = `https://${websiteSlug}.painel.adminimobiliaria.site`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        else {
            toast({
                title: "URL do painel não configurada",
                description: "Configure sua URL nas configurações do site primeiro.",
                variant: "destructive"
            });
        }
    };
    return ((0, jsx_runtime_1.jsx)(DashboardLayout_1.default, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-fade-in", children: [(0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-primary/10 rounded-lg", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-6 w-6 text-primary" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight", children: "Dashboard" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-muted-foreground", children: ["Bem-vindo de volta, ", user.email?.split('@')[0]] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [lastUpdated && ((0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-muted-foreground hidden sm:block", children: ["Atualizado \u00E0s ", lastUpdated.toLocaleTimeString()] })), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", size: "sm", onClick: () => refreshDashboard(), disabled: dashboardLoading, className: "h-8", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: `h-3 w-3 mr-1 ${dashboardLoading ? 'animate-spin' : ''}` }), "Atualizar"] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary group", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Im\u00F3veis Ativos" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "text-xs", children: "Total de im\u00F3veis publicados" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { className: "h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-200" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl sm:text-3xl font-bold tracking-tight", children: dashboardLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "w-12 h-8 bg-muted animate-pulse rounded" })) : dashboardStats?.activeProperties || 0 }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground mt-1", children: (dashboardStats?.activeProperties || 0) === 0 ? 'Nenhum imóvel cadastrado' : 'Disponíveis no site' })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 group", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Leads do M\u00EAs" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "text-xs", children: "Contatos recebidos este m\u00EAs" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform duration-200" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl sm:text-3xl font-bold tracking-tight", children: dashboardLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "w-12 h-8 bg-muted animate-pulse rounded" })) : dashboardStats?.totalLeads || 0 }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground mt-1", children: (dashboardStats?.totalLeads || 0) === 0 ? 'Nenhum lead ainda' : 'Novos interessados' })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 group", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-muted-foreground", children: "Visualiza\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "text-xs", children: "Total de visitas aos im\u00F3veis" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-4 w-4 text-green-500 group-hover:scale-110 transition-transform duration-200" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl sm:text-3xl font-bold tracking-tight", children: dashboardLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "w-12 h-8 bg-muted animate-pulse rounded" })) : '~' + (dashboardStats?.totalProperties ? dashboardStats.totalProperties * 45 : 0) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground mt-1", children: !dashboardStats?.totalProperties || dashboardStats.totalProperties === 0 ? 'Sem visualizações' : 'Total estimado de acessos' })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-lg font-semibold mb-6 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1 h-5 bg-primary rounded-full" }), "A\u00E7\u00F5es R\u00E1pidas"] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { className: "h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 bg-primary hover:bg-primary/90", onClick: () => navigate('/dashboard/properties'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { className: "h-6 w-6 group-hover:scale-110 transition-transform duration-200" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Adicionar Im\u00F3vel" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2", onClick: () => navigate('/dashboard/settings'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "h-6 w-6 group-hover:rotate-90 transition-transform duration-200" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Configura\u00E7\u00F5es" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2", onClick: () => navigate('/dashboard/leads'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-6 w-6 group-hover:scale-110 transition-transform duration-200" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Gerenciar Leads" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2", onClick: handleViewPublicSite, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { className: "h-6 w-6 group-hover:scale-110 transition-transform duration-200" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Ver Site P\u00FAblico" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "outline", className: "h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2", onClick: handleViewDashboardSite, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "h-6 w-6 group-hover:rotate-90 transition-transform duration-200" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Abrir Painel (subdom\u00EDnio)" })] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mt-8 bg-gradient-to-br from-card to-muted/20 border-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-1 bg-primary/10 rounded-md", children: (0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { className: "h-4 w-4 text-primary" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-lg", children: "Primeiros Passos" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "text-sm", children: "Configure sua imobili\u00E1ria e comece a vender" })] })] }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4 p-3 rounded-lg bg-card border transition-all duration-200 hover:shadow-md", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0", children: "1" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium", children: "Complete seu perfil e personalize sua marca" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Configure logo, cores e informa\u00E7\u00F5es da empresa" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => navigate('/dashboard/settings'), className: "text-primary hover:text-primary/80", children: "Configurar" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4 p-3 rounded-lg bg-card border transition-all duration-200 hover:shadow-md", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0", children: "2" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium", children: "Adicione seu primeiro im\u00F3vel" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Comece cadastrando propriedades para venda ou loca\u00E7\u00E3o" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => navigate('/dashboard/properties'), className: "text-primary hover:text-primary/80", children: "Adicionar" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4 p-3 rounded-lg bg-card border transition-all duration-200 hover:shadow-md", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0", children: "3" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium", children: "Configure pixels de rastreamento" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Adicione Google Analytics, Facebook Pixel, etc." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "ghost", onClick: () => navigate('/dashboard/website'), className: "text-primary hover:text-primary/80", children: "Configurar" })] })] }) })] })] }) }));
};
exports.default = Dashboard;
