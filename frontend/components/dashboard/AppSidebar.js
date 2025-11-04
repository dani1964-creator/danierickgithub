"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const logger_1 = require("@/lib/logger");
const lucide_react_1 = require("lucide-react");
const sidebar_context_1 = require("@/components/ui/sidebar-context");
const sidebar_1 = require("@/components/ui/sidebar");
const button_1 = require("@/components/ui/button");
const useAuth_1 = require("@shared/hooks/useAuth");
const AppSidebar = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    const { signOut } = (0, useAuth_1.useAuth)();
    const { state, setOpen, open } = (0, sidebar_context_1.useSidebar)();
    const isCollapsed = state === "collapsed";
    const menuItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: lucide_react_1.Home,
        },
        {
            title: 'Imóveis',
            url: '/dashboard/properties',
            icon: lucide_react_1.Building2,
        },
        {
            title: 'Leads',
            url: '/dashboard/leads',
            icon: lucide_react_1.Users,
        },
        {
            title: 'Corretores',
            url: '/dashboard/realtors',
            icon: lucide_react_1.UserCheck,
        },
        {
            title: 'Site',
            url: '/dashboard/website',
            icon: lucide_react_1.Globe,
        },
        {
            title: 'Configurações',
            url: '/dashboard/settings',
            icon: lucide_react_1.Settings,
        },
    ];
    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/auth');
        }
        catch (error) {
            logger_1.logger.error('Error signing out:', error);
        }
    };
    return ((0, jsx_runtime_1.jsxs)(sidebar_1.Sidebar, { collapsible: "icon", className: `transition-all duration-300 ${!open ? 'w-0 overflow-hidden border-r-0' : ''}`, style: { display: !open ? 'none' : 'flex' }, children: [(0, jsx_runtime_1.jsx)(sidebar_1.SidebarHeader, { children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 px-4 py-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-primary rounded-lg", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Home, { className: "h-5 w-5 text-primary-foreground flex-shrink-0" }) }), !isCollapsed && ((0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-bold tracking-tight truncate", children: "IMOBIDEPS" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground truncate", children: "Sistema de Im\u00F3veis" })] }))] }) }), (0, jsx_runtime_1.jsx)(sidebar_1.SidebarContent, { children: (0, jsx_runtime_1.jsx)(sidebar_1.SidebarGroup, { children: (0, jsx_runtime_1.jsx)(sidebar_1.SidebarGroupContent, { children: (0, jsx_runtime_1.jsx)(sidebar_1.SidebarMenu, { className: "space-y-1", children: menuItems.map((item) => ((0, jsx_runtime_1.jsx)(sidebar_1.SidebarMenuItem, { children: (0, jsx_runtime_1.jsxs)(sidebar_1.SidebarMenuButton, { onClick: () => navigate(item.url), isActive: location.pathname === item.url, tooltip: isCollapsed ? item.title : undefined, className: "group transition-all duration-200 hover:bg-sidebar-accent/80 data-[state=open]:bg-sidebar-accent", children: [(0, jsx_runtime_1.jsx)(item.icon, { className: "h-4 w-4 group-hover:scale-110 transition-transform duration-200" }), !isCollapsed && ((0, jsx_runtime_1.jsx)("span", { className: "font-medium group-hover:translate-x-0.5 transition-transform duration-200", children: item.title }))] }) }, item.title))) }) }) }) }), (0, jsx_runtime_1.jsx)(sidebar_1.SidebarFooter, { children: !isCollapsed && ((0, jsx_runtime_1.jsx)("div", { className: "p-4 border-t", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", className: "w-full group hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200", onClick: handleSignOut, children: (0, jsx_runtime_1.jsx)("span", { className: "group-hover:scale-105 transition-transform duration-200", children: "Sair" }) }) })) })] }));
};
exports.default = AppSidebar;
