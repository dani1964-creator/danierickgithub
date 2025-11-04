"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SecurityDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const card_1 = require("@/components/ui/card");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const tabs_1 = require("@/components/ui/tabs");
const client_1 = require("@/integrations/supabase/client");
const useAuth_1 = require("@shared/hooks/useAuth");
function SecurityDashboard() {
    const { user } = (0, useAuth_1.useAuth)();
    const [securityLogs, setSecurityLogs] = (0, react_1.useState)([]);
    const [contactLogs, setContactLogs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [stats, setStats] = (0, react_1.useState)({
        totalEvents: 0,
        suspiciousEvents: 0,
        contactAccesses: 0,
        rateLimitedEvents: 0
    });
    const fetchSecurityData = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            // Fetch security logs for the current user
            const { data: secLogs, error: secError } = await client_1.supabase
                .from('security_logs')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(50);
            if (secError)
                throw secError;
            // Fetch contact access logs for broker's properties
            const { data: contactData, error: contactError } = await client_1.supabase
                .from('contact_access_logs')
                .select('*')
                .order('accessed_at', { ascending: false })
                .limit(50);
            if (contactError)
                throw contactError;
            setSecurityLogs((secLogs || []));
            setContactLogs((contactData || []));
            // Calculate statistics
            const suspiciousCount = secLogs?.filter(log => log.event_type.includes('suspicious') ||
                log.event_type.includes('rate_limit')).length || 0;
            const rateLimitedCount = secLogs?.filter(log => log.event_type.includes('rate_limit')).length || 0;
            setStats({
                totalEvents: secLogs?.length || 0,
                suspiciousEvents: suspiciousCount,
                contactAccesses: contactData?.length || 0,
                rateLimitedEvents: rateLimitedCount
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching security data:', error);
        }
        finally {
            setLoading(false);
        }
    }, [user?.id]);
    (0, react_1.useEffect)(() => {
        if (user) {
            fetchSecurityData();
        }
    }, [user, fetchSecurityData]);
    const getEventTypeColor = (eventType) => {
        if (eventType.includes('suspicious'))
            return 'destructive';
        if (eventType.includes('rate_limit'))
            return 'secondary';
        if (eventType.includes('auth'))
            return 'default';
        if (eventType.includes('form'))
            return 'outline';
        return 'default';
    };
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('pt-BR');
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold", children: "Painel de Seguran\u00E7a" }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 md:grid-cols-4", children: [1, 2, 3, 4].map(i => ((0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-16 bg-muted animate-pulse rounded" }) }) }, i))) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold", children: "Painel de Seguran\u00E7a" }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: fetchSecurityData, variant: "outline", children: "Atualizar" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-4", children: [(0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: stats.totalEvents }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Eventos Totais" })] }) }), (0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-red-600", children: stats.suspiciousEvents }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Atividades Suspeitas" })] }) }), (0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: stats.contactAccesses }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Acessos a Contatos" })] }) }), (0, jsx_runtime_1.jsx)(card_1.Card, { children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-orange-600", children: stats.rateLimitedEvents }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted-foreground", children: "Rate Limit Ativado" })] }) })] }), (0, jsx_runtime_1.jsxs)(tabs_1.Tabs, { defaultValue: "security", className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)(tabs_1.TabsList, { children: [(0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "security", children: "Logs de Seguran\u00E7a" }), (0, jsx_runtime_1.jsx)(tabs_1.TabsTrigger, { value: "contact", children: "Acessos a Contatos" })] }), (0, jsx_runtime_1.jsx)(tabs_1.TabsContent, { value: "security", className: "space-y-4", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Eventos de Seguran\u00E7a" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "\u00DAltimos 50 eventos de seguran\u00E7a registrados" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: securityLogs.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "Nenhum evento registrado" })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: securityLogs.map((log) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: getEventTypeColor(log.event_type), children: log.event_type }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium", children: ["IP: ", log.ip_address || 'N/A'] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: formatTimestamp(log.created_at) })] })] }), log.metadata && ((0, jsx_runtime_1.jsx)("div", { className: "text-xs text-muted-foreground max-w-xs truncate", children: JSON.stringify(log.metadata) }))] }, log.id))) })) })] }) }), (0, jsx_runtime_1.jsx)(tabs_1.TabsContent, { value: "contact", className: "space-y-4", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Acessos a Informa\u00E7\u00F5es de Contato" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Monitoramento de solicita\u00E7\u00F5es de dados de contato" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: contactLogs.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-muted-foreground", children: "Nenhum acesso registrado" })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: contactLogs.map((log) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "outline", children: log.access_type }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium", children: ["IP: ", log.user_ip || 'N/A'] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted-foreground", children: formatTimestamp(log.accessed_at) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-muted-foreground max-w-xs truncate", children: log.user_agent })] }, log.id))) })) })] }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Recomenda\u00E7\u00F5es de Seguran\u00E7a" }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 bg-orange-500 rounded-full" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", children: "Configure OTP expiry para 15 minutos nas configura\u00E7\u00F5es do Supabase Auth" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 bg-orange-500 rounded-full" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", children: "Ative a prote\u00E7\u00E3o contra senhas vazadas nas configura\u00E7\u00F5es de autentica\u00E7\u00E3o" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", children: "Monitoramento de seguran\u00E7a ativo e funcionando" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", children: "Rate limiting implementado para formul\u00E1rios e acessos" })] })] })] })] }));
}
