"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentBrokerId = exports.BrokerResolver = void 0;
exports.useBrokerResolver = useBrokerResolver;
const react_1 = __importDefault(require("react"));
const logger_1 = require("@/lib/logger");
const client_1 = require("@/integrations/supabase/client");
/**
 * Resolve broker_id baseado no host atual usando Edge Function ou fallback local
 * Implementa a recomendação das novas políticas RLS
 */
class BrokerResolver {
    /**
     * Resolve broker_id para o host atual
     * Tenta usar Edge Function primeiro, fallback para resolução local
     */
    static async resolveBrokerByHost(host) {
        const targetHost = host || window.location.host.toLowerCase();
        // Verificar cache primeiro
        const cached = this.cache.get(targetHost);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.brokerId;
        }
        try {
            // Tentar Edge Function primeiro (recomendado)
            const brokerId = await this.resolveViaEdgeFunction(targetHost);
            // Cache o resultado
            this.cache.set(targetHost, { brokerId, timestamp: Date.now() });
            return brokerId;
        }
        catch (error) {
            logger_1.logger.warn('Edge Function falhou, usando fallback local:', error);
            // Fallback para resolução local
            const brokerId = await this.resolveViaLocalQuery(targetHost);
            // Cache o resultado
            this.cache.set(targetHost, { brokerId, timestamp: Date.now() });
            return brokerId;
        }
    }
    /**
     * Resolve via Edge Function host-to-broker (recomendado)
     */
    static async resolveViaEdgeFunction(host) {
        const { data, error } = await client_1.supabase.functions.invoke('host-to-broker', {
            headers: {
                'Host': host,
                'X-Forwarded-Host': host
            }
        });
        if (error)
            throw error;
        return data?.broker_id || null;
    }
    /**
     * Fallback: resolve localmente (compatibilidade)
     */
    static async resolveViaLocalQuery(host) {
        const baseDomain = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN)
            ? String(process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN).toLowerCase()
            : 'adminimobiliaria.site';
        try {
            // Subdomínio *.adminimobiliaria.site
            if (host.endsWith(`.${baseDomain}`)) {
                const subdomain = host.slice(0, -(baseDomain.length + 1));
                // 'admin' é reservado
                if (subdomain === 'admin')
                    return null;
                const { data, error } = await client_1.supabase
                    .from('brokers')
                    .select('id')
                    .eq('website_slug', subdomain)
                    .eq('is_active', true)
                    .maybeSingle();
                if (error)
                    throw error;
                return data?.id || null;
            }
            // Domínio customizado
            const { data: domainData, error: domainError } = await client_1.supabase
                .from('broker_domains')
                .select('broker_id')
                .eq('domain', host)
                .eq('is_active', true)
                .maybeSingle();
            if (domainError)
                throw domainError;
            if (domainData?.broker_id) {
                // Verificar se o broker está ativo
                const { data: brokerData, error: brokerError } = await client_1.supabase
                    .from('brokers')
                    .select('id')
                    .eq('id', domainData.broker_id)
                    .eq('is_active', true)
                    .maybeSingle();
                if (brokerError)
                    throw brokerError;
                return brokerData?.id || null;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Erro na resolução local do broker:', error);
            return null;
        }
    }
    /**
     * Limpar cache (útil para testes ou mudanças de configuração)
     */
    static clearCache() {
        this.cache.clear();
    }
    /**
     * Helper para obter broker_id atual do request/contexto
     * Implementa a recomendação getCurrentBrokerId(req)
     */
    static async getCurrentBrokerId() {
        return this.resolveBrokerByHost();
    }
}
exports.BrokerResolver = BrokerResolver;
BrokerResolver.cache = new Map();
BrokerResolver.CACHE_TTL = 5 * 60 * 1000; // 5 minutos
/**
 * Hook React para resolver broker baseado no host
 * OTIMIZADO: conforme recomendações do Supabase Assistant IA
 * - Tenta Edge Function primeiro
 * - Fallback para resolução local
 * - Cache para performance
 */
function useBrokerResolver() {
    const [brokerId, setBrokerId] = react_1.default.useState(null);
    const [loading, setLoading] = react_1.default.useState(true);
    const [error, setError] = react_1.default.useState(null);
    react_1.default.useEffect(() => {
        let mounted = true;
        const resolveBroker = async () => {
            try {
                setLoading(true);
                setError(null);
                const resolvedBrokerId = await BrokerResolver.getCurrentBrokerId();
                if (mounted) {
                    setBrokerId(resolvedBrokerId);
                }
            }
            catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Erro ao resolver broker');
                    setBrokerId(null);
                }
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        resolveBroker();
        return () => {
            mounted = false;
        };
    }, []);
    return {
        brokerId,
        loading,
        error,
        refetch: () => {
            BrokerResolver.clearCache();
            return BrokerResolver.getCurrentBrokerId();
        }
    };
}
// Re-export para compatibilidade
exports.getCurrentBrokerId = BrokerResolver.getCurrentBrokerId;
