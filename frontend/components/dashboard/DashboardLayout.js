"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const useAuth_1 = require("@shared/hooks/useAuth");
const button_1 = require("@/components/ui/button");
const sidebar_1 = require("@/components/ui/sidebar");
const AppSidebar_1 = __importDefault(require("./AppSidebar"));
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
const DashboardLayout = ({ children }) => {
    const { signOut } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const handleSignOut = async () => {
        try {
            await signOut();
            toast({
                title: "Logout realizado",
                description: "Você foi desconectado com sucesso.",
            });
        }
        catch (error) {
            toast({
                title: "Erro no logout",
                description: "Ocorreu um erro ao desconectar.",
                variant: "destructive"
            });
        }
    };
    return ((0, jsx_runtime_1.jsx)(sidebar_1.SidebarProvider, { children: (0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen flex w-full", children: [(0, jsx_runtime_1.jsx)(AppSidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "flex-1 flex flex-col min-w-0 w-full", children: [(0, jsx_runtime_1.jsx)("header", { className: "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full sticky top-0 z-10", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex h-16 items-center justify-between px-6 w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4 min-w-0", children: [(0, jsx_runtime_1.jsx)(sidebar_1.SidebarTrigger, { className: "hover:bg-accent/80 transition-colors duration-200" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-1 h-6 bg-primary rounded-full" }), (0, jsx_runtime_1.jsx)("h1", { className: "font-bold text-lg tracking-tight truncate", children: "Painel Administrativo" })] })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "ghost", size: "sm", onClick: handleSignOut, className: "flex items-center gap-2 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline font-medium", children: "Sair" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-auto w-full bg-muted/20 min-h-0", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-fade-in p-6", children: children }) })] })] }) }));
};
exports.default = DashboardLayout;
