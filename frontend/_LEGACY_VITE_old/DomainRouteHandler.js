"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainRouteHandler = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const useAuth_1 = require("@/hooks/useAuth");
const useDomainAware_1 = require("@/hooks/useDomainAware");
const brokerResolver_1 = require("@/lib/brokerResolver");
const publicQueries_1 = require("@/lib/publicQueries");
const react_1 = require("react");
const PublicSite_1 = __importDefault(require("@/pages/PublicSite"));
const Dashboard_1 = __importDefault(require("@/pages/Dashboard"));
const AuthForm_1 = __importDefault(require("@/components/auth/AuthForm"));
const BrokerNotFound_1 = __importDefault(require("@/pages/BrokerNotFound"));
const tenant_1 = require("@/lib/tenant");
const logger_1 = require("@/lib/logger");
const DomainRouteHandler = () => {
    const { isAuthenticated, loading: authLoading } = (0, useAuth_1.useAuth)();
    const { getBrokerByDomainOrSlug } = (0, useDomainAware_1.useDomainAware)();
    const { brokerId, loading: brokerResolverLoading } = (0, brokerResolver_1.useBrokerResolver)();
    const location = (0, react_router_dom_1.useLocation)();
    const [broker, setBroker] = (0, react_1.useState)(null);
    const [isDevHost, setIsDevHost] = (0, react_1.useState)(false);
    // Verificar se existe broker para o host atual
    (0, react_1.useEffect)(() => {
        const checkBroker = async () => {
            try {
                // Verificar se é ambiente de desenvolvimento
                const isDev = (0, tenant_1.isDevelopmentHost)();
                setIsDevHost(isDev);
                // Se é desenvolvimento, não precisamos de broker - usar modo dashboard
                if (isDev) {
                    setBroker(null); // Sem broker específico
                    return;
                }
                // Produção: usar validação otimizada (implementa Edge Function + fallback)
                const hasValidBroker = await (0, publicQueries_1.validateCurrentHost)();
                if (hasValidBroker) {
                    const brokerData = await getBrokerByDomainOrSlug();
                    setBroker(brokerData);
                }
                else {
                    setBroker(null);
                }
            }
            catch (error) {
                logger_1.logger.error('Error checking broker:', error);
                setBroker(null);
            }
        };
        if (!brokerResolverLoading) {
            checkBroker();
        }
    }, [brokerResolverLoading, getBrokerByDomainOrSlug]);
    // Loading state
    if (authLoading || brokerResolverLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-background", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center animate-fade-in", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-xs text-muted-foreground", children: "Carregando..." })] }) }));
    }
    // Comportamento baseado na rota e presença de broker
    if (location.pathname === '/') {
        // Ambiente de desenvolvimento: ir direto para auth/dashboard
        if (isDevHost) {
            if (!isAuthenticated) {
                return (0, jsx_runtime_1.jsx)(AuthForm_1.default, {});
            }
            return (0, jsx_runtime_1.jsx)(Dashboard_1.default, {});
        }
        // Produção: Se não há broker válido para este host, mostrar 404
        if (!broker) {
            return (0, jsx_runtime_1.jsx)(BrokerNotFound_1.default, {});
        }
        // Se há broker válido mas usuário não está autenticado, mostrar site público
        if (!isAuthenticated) {
            return (0, jsx_runtime_1.jsx)(PublicSite_1.default, {});
        }
        // Se há broker válido e usuário autenticado, verificar se é o mesmo broker
        // Por enquanto, mostrar dashboard (auth já valida se é o broker correto)
        return (0, jsx_runtime_1.jsx)(Dashboard_1.default, {});
    }
    // Para rota /auth, verificar se há broker válido
    if (location.pathname === '/auth') {
        // Ambiente de desenvolvimento: sempre permitir auth
        if (isDevHost) {
            return (0, jsx_runtime_1.jsx)(AuthForm_1.default, {});
        }
        // Produção: requer broker válido
        if (!broker) {
            return (0, jsx_runtime_1.jsx)(BrokerNotFound_1.default, {});
        }
        return (0, jsx_runtime_1.jsx)(AuthForm_1.default, {});
    }
    // Para outras rotas, deixar o router tratar normalmente
    // mas se não há broker válido e é uma rota que requer broker, mostrar 404
    // NOTA: /admin (SuperAdmin) não requer broker específico - funciona globalmente
    const routesRequiringBroker = ['/dashboard'];
    const requiresBroker = routesRequiringBroker.some(route => location.pathname.startsWith(route));
    // Ambiente de desenvolvimento: sempre permitir rotas administrativas
    if (requiresBroker && !isDevHost && !broker) {
        return (0, jsx_runtime_1.jsx)(BrokerNotFound_1.default, {});
    }
    return null;
};
exports.DomainRouteHandler = DomainRouteHandler;
