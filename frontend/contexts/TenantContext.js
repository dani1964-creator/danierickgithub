'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRequireTenant = exports.useTenant = void 0;
exports.TenantProvider = TenantProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const TenantContext = (0, react_1.createContext)({
    tenant: null,
    loading: true,
    error: null,
    refetchTenant: () => { }
});
function TenantProvider({ children, initialTenant }) {
    const [tenant, setTenant] = (0, react_1.useState)(initialTenant || null);
    const [loading, setLoading] = (0, react_1.useState)(!initialTenant);
    const [error, setError] = (0, react_1.useState)(null);
    const loadTenant = async () => {
        try {
            setLoading(true);
            setError(null);
            // Primeiro, tentar obter do header (setado pelo middleware)
            const tenantHeader = document.querySelector('meta[name="x-tenant-data"]')?.getAttribute('content');
            if (tenantHeader) {
                try {
                    const tenantFromHeader = JSON.parse(tenantHeader);
                    setTenant(tenantFromHeader);
                    applyTenantTheme(tenantFromHeader);
                    setLoading(false);
                    return;
                }
                catch (e) {
                    logger_1.logger.warn('Failed to parse tenant from header');
                }
            }
            // Fallback: fazer requisição para API
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/tenant/info`, {
                headers: {
                    'x-tenant-domain': window.location.hostname
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Imobiliária não encontrada para este domínio');
                }
                throw new Error('Erro ao carregar dados da imobiliária');
            }
            const data = await response.json();
            setTenant(data.tenant);
            applyTenantTheme(data.tenant);
        }
        catch (err) {
            logger_1.logger.error('Error loading tenant:', err);
            setError(err.message || 'Erro ao carregar dados da imobiliária');
        }
        finally {
            setLoading(false);
        }
    };
    const applyTenantTheme = (tenantData) => {
        if (!tenantData.theme_settings)
            return;
        const theme = tenantData.theme_settings;
        const root = document.documentElement;
        // Aplicar cores personalizadas
        if (theme.primary_color) {
            root.style.setProperty('--primary-color', theme.primary_color);
            root.style.setProperty('--color-primary', theme.primary_color);
        }
        if (theme.secondary_color) {
            root.style.setProperty('--secondary-color', theme.secondary_color);
            root.style.setProperty('--color-secondary', theme.secondary_color);
        }
        // Aplicar título da página
        if (tenantData.site_title) {
            document.title = tenantData.site_title;
        }
        // Aplicar favicon se disponível
        if (tenantData.site_favicon_url) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = tenantData.site_favicon_url;
        }
        logger_1.logger.info(`🎨 Applied theme for: ${tenantData.business_name}`);
    };
    const refetchTenant = () => {
        loadTenant();
    };
    (0, react_1.useEffect)(() => {
        if (!initialTenant) {
            loadTenant();
        }
        else {
            applyTenantTheme(initialTenant);
        }
    }, []);
    const contextValue = {
        tenant,
        loading,
        error,
        refetchTenant
    };
    return ((0, jsx_runtime_1.jsx)(TenantContext.Provider, { value: contextValue, children: children }));
}
const useTenant = () => {
    const context = (0, react_1.useContext)(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
exports.useTenant = useTenant;
// Hook para verificar se estamos em um contexto de tenant válido
const useRequireTenant = () => {
    const { tenant, loading, error } = (0, exports.useTenant)();
    const isReady = !loading && !error && tenant;
    const hasError = error || (!loading && !tenant);
    return {
        tenant,
        loading,
        error,
        isReady,
        hasError
    };
};
exports.useRequireTenant = useRequireTenant;
