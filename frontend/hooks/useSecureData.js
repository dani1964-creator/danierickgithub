"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSecureProperties = useSecureProperties;
exports.useSecureBrokerContact = useSecureBrokerContact;
exports.useSecurePropertySearch = useSecurePropertySearch;
const react_1 = require("react");
const enhanced_security_1 = require("@/lib/enhanced-security");
function useSecureProperties(limit = 50, options = {}) {
    const [data, setData] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchData = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            setError(null);
            const properties = await enhanced_security_1.EnhancedSecurity.getPublicProperties(limit);
            setData(properties);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            options.onError?.(error);
        }
        finally {
            setLoading(false);
        }
    }, [limit, options]);
    (0, react_1.useEffect)(() => {
        if (options.enabled !== false) {
            fetchData();
        }
    }, [fetchData, options.enabled]);
    (0, react_1.useEffect)(() => {
        if (options.refetchInterval && options.enabled !== false) {
            const interval = setInterval(fetchData, options.refetchInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, options.refetchInterval, options.enabled]);
    return {
        data,
        loading,
        error,
        refetch: fetchData
    };
}
function useSecureBrokerContact(brokerSlug) {
    const [contactInfo, setContactInfo] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchContactInfo = (0, react_1.useCallback)(async () => {
        if (!brokerSlug)
            return null;
        try {
            setLoading(true);
            setError(null);
            const contact = await enhanced_security_1.EnhancedSecurity.getBrokerContactInfo(brokerSlug);
            setContactInfo(contact);
            return contact;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch contact info');
            setError(error);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [brokerSlug]);
    return {
        contactInfo,
        loading,
        error,
        fetchContactInfo
    };
}
function useSecurePropertySearch() {
    const [results, setResults] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const search = (0, react_1.useCallback)(async (searchTerm, filters = {}, limit = 20) => {
        try {
            setLoading(true);
            setError(null);
            const properties = await enhanced_security_1.EnhancedSecurity.searchProperties(searchTerm, filters, limit);
            setResults(properties);
            return properties;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Search failed');
            setError(error);
            return [];
        }
        finally {
            setLoading(false);
        }
    }, []);
    return {
        results,
        loading,
        error,
        search
    };
}
