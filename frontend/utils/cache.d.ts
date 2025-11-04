/**
 * Sistema de Cache Multi-Nível para Redução de Egress do Supabase
 *
 * PROBLEMA: Consumindo >4GB/mês no plano gratuito (limite: 500MB)
 * SOLUÇÃO: Cache em memória, sessionStorage e localStorage
 *
 * IMPACTO ESPERADO: Redução de 80-90% no tráfego de dados
 */
export interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
    key: string;
}
export interface CacheStats {
    memoryItems: number;
    sessionItems: number;
    localItems: number;
    memorySize: string;
    sessionSize: string;
    localSize: string;
}
declare class MultiLevelCache {
    private memoryCache;
    private readonly MAX_MEMORY_ITEMS;
    private readonly MAX_STORAGE_SIZE;
    /**
     * Cache em memória (mais rápido, menor TTL)
     * Usado para: Consultas frequentes, dados que mudam rapidamente
     */
    setMemory<T>(key: string, data: T, ttlMinutes?: number): void;
    getMemory<T>(key: string): T | null;
    /**
     * Cache em sessionStorage (dados da sessão)
     * Usado para: Dados que podem persistir durante a sessão
     */
    setSession<T>(key: string, data: T, ttlMinutes?: number): void;
    getSession<T>(key: string): T | null;
    /**
     * Cache em localStorage (dados semi-permanentes)
     * Usado para: Configurações, dados estáticos, listas que mudam pouco
     */
    setLocal<T>(key: string, data: T, ttlHours?: number): void;
    getLocal<T>(key: string): T | null;
    /**
     * Busca em cascata: memory -> session -> local
     * Promove dados para caches mais rápidos quando encontrados
     */
    get<T>(key: string, ttlMinutes?: number): T | null;
    /**
     * Set em múltiplos níveis baseado na importância dos dados
     */
    set<T>(key: string, data: T, options?: {
        memoryTTL?: number;
        sessionTTL?: number;
        localTTL?: number;
    }): void;
    private clearOldestMemoryItems;
    private hasStorageSpace;
    private clearExpiredSession;
    private clearOldestSession;
    private clearExpiredLocal;
    private clearOldestLocal;
    invalidate(pattern: string): void;
    clearAll(): void;
    getStats(): CacheStats;
    startAutomaticCleanup(intervalMinutes?: number): () => void;
}
export declare const cache: MultiLevelCache;
/**
 * Utilitários para gerar chaves de cache consistentes
 */
export declare const cacheKeys: {
    properties: (brokerId: string, filters?: any, page?: number, limit?: number) => string;
    property: (id: string) => string;
    brokers: (page?: number, limit?: number) => string;
    broker: (id: string) => string;
    brokerBySlug: (slug: string) => string;
    dashboard: (brokerId: string) => string;
    dashboardStats: (brokerId: string) => string;
    leads: (brokerId: string, page?: number, limit?: number) => string;
    settings: (brokerId: string) => string;
    propertyTypes: () => string;
    cities: () => string;
    neighborhoods: (city: string) => string;
};
export default cache;
