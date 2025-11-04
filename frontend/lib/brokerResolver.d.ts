/**
 * Resolve broker_id baseado no host atual usando Edge Function ou fallback local
 * Implementa a recomendação das novas políticas RLS
 */
export declare class BrokerResolver {
    private static cache;
    private static CACHE_TTL;
    /**
     * Resolve broker_id para o host atual
     * Tenta usar Edge Function primeiro, fallback para resolução local
     */
    static resolveBrokerByHost(host?: string): Promise<string | null>;
    /**
     * Resolve via Edge Function host-to-broker (recomendado)
     */
    private static resolveViaEdgeFunction;
    /**
     * Fallback: resolve localmente (compatibilidade)
     */
    private static resolveViaLocalQuery;
    /**
     * Limpar cache (útil para testes ou mudanças de configuração)
     */
    static clearCache(): void;
    /**
     * Helper para obter broker_id atual do request/contexto
     * Implementa a recomendação getCurrentBrokerId(req)
     */
    static getCurrentBrokerId(): Promise<string | null>;
}
/**
 * Hook React para resolver broker baseado no host
 * OTIMIZADO: conforme recomendações do Supabase Assistant IA
 * - Tenta Edge Function primeiro
 * - Fallback para resolução local
 * - Cache para performance
 */
export declare function useBrokerResolver(): {
    brokerId: string;
    loading: boolean;
    error: string;
    refetch: () => Promise<string>;
};
export declare const getCurrentBrokerId: typeof BrokerResolver.getCurrentBrokerId;
