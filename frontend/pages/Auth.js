"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const card_1 = require("@/components/ui/card");
const useAuth_1 = require("@shared/hooks/useAuth");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
const Auth = () => {
    const { user, signIn } = (0, useAuth_1.useAuth)();
    const { toast } = (0, use_toast_1.useToast)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    // Redirecionar se já estiver logado
    if (user) {
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/dashboard", replace: true });
    }
    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');
        const { error } = await signIn(email, password);
        if (error) {
            toast({
                title: "Erro no login",
                description: error.message,
                variant: "destructive"
            });
        }
        else {
            toast({
                title: "Login realizado com sucesso!",
                description: "Redirecionando para o painel..."
            });
        }
        setLoading(false);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-50 w-full h-full m-0 p-4 bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0 overflow-hidden pointer-events-none z-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" })] }), (0, jsx_runtime_1.jsx)("div", { className: "absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "text-center pb-8 pt-8", children: [(0, jsx_runtime_1.jsx)("img", { src: "/imobideps-logo.svg", alt: "IMOBIDEPS", className: "mx-auto mb-4 w-12 h-12" }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent", children: "IMOBIDEPS" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "text-base text-muted-foreground mt-2", children: "Sistema de Im\u00F3veis \u2014 acesse seu painel" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "px-8 pb-8", children: [(0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSignIn, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "email", className: "text-sm font-medium flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-4 w-4 text-primary" }), "Email"] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", name: "email", type: "email", placeholder: "seu@email.com", required: true, className: "h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "password", className: "text-sm font-medium flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.KeyRound, { className: "h-4 w-4 text-primary" }), "Senha"] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "password", name: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, className: "h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none", disabled: loading, children: loading ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "mr-2 h-5 w-5 animate-spin" }), "Entrando..."] })) : ("Entrar no IMOBIDEPS") })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 text-center", children: (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: "Novos usu\u00E1rios devem ser cadastrados pelo administrador" }) })] })] }) })] }));
};
exports.default = Auth;
