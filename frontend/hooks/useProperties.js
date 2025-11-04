'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProperties = useProperties;
exports.useProperty = useProperty;
const react_1 = require("react");
const logger_1 = require("@/lib/logger");
const TenantContext_1 = require("../contexts/TenantContext");
function useProperties(options = {}) {
    const { tenant, loading: tenantLoading } = (0, TenantContext_1.useTenant)();
    const { page = 1, limit = 12, filters = {}, enabled = true } = options;
    const [properties, setProperties] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [totalCount, setTotalCount] = (0, react_1.useState)(0);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(page);
    const fetchProperties = async () => {
        if (!tenant || tenantLoading || !enabled)
            return;
        try {
            setLoading(true);
            setError(null);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            // Construir query string com filtros
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...Object.entries(filters).reduce((acc, [key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        acc[key] = value.toString();
                    }
                    return acc;
                }, {})
            });
            const response = await fetch(`${apiUrl}/api/public/properties?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-domain': window.location.hostname
                }
            });
            if (!response.ok) {
                throw new Error(`Erro ao carregar propriedades: ${response.status}`);
            }
            const data = await response.json();
            setProperties(data.data || []);
            setTotalCount(data.pagination?.total || 0);
            setCurrentPage(data.pagination?.page || 1);
            logger_1.logger.info(`✅ Loaded ${data.data?.length || 0} properties for ${tenant.business_name}`);
        }
        catch (err) {
            logger_1.logger.error('Error fetching properties:', err);
            setError(err.message || 'Erro ao carregar propriedades');
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchProperties();
    }, [tenant, page, limit, JSON.stringify(filters), enabled]);
    const hasMore = properties.length < totalCount;
    return {
        properties,
        loading,
        error,
        totalCount,
        hasMore,
        currentPage,
        refetch: fetchProperties
    };
}
// Hook para uma propriedade específica
function useProperty(propertyId) {
    const { tenant } = (0, TenantContext_1.useTenant)();
    const [property, setProperty] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchProperty = async () => {
        if (!tenant || !propertyId)
            return;
        try {
            setLoading(true);
            setError(null);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/public/properties/${propertyId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-domain': window.location.hostname
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Propriedade não encontrada');
                }
                throw new Error(`Erro ao carregar propriedade: ${response.status}`);
            }
            const data = await response.json();
            setProperty(data.data);
        }
        catch (err) {
            logger_1.logger.error('Error fetching property:', err);
            setError(err.message || 'Erro ao carregar propriedade');
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchProperty();
    }, [tenant, propertyId]);
    return {
        property,
        loading,
        error,
        refetch: fetchProperty
    };
}
