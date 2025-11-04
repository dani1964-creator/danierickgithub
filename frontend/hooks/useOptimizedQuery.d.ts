/**
 * Hook Otimizado Universal para Redução de Egress do Supabase
 *
 * PROBLEMA RESOLVIDO:
 * - Consultas sem limite carregando milhares de registros
 * - SELECT * retornando dados desnecessários
 * - Ausência de cache causando requisições repetidas
 * - JOINs pesados sem necessidade
 *
 * SOLUÇÃO:
 * - Limite automático em todas as consultas
 * - Seleção apenas de campos necessários
 * - Cache inteligente em 3 níveis
 * - Paginação automática
 * - Otimização de JOINs
 */
export interface UseOptimizedQueryOptions {
    page?: number;
    limit?: number;
    enableCache?: boolean;
    memoryTTL?: number;
    sessionTTL?: number;
    localTTL?: number;
    orderBy?: {
        column: string;
        ascending?: boolean;
    };
    realtime?: boolean;
    logQueries?: boolean;
}
export interface UseOptimizedQueryResult<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    totalCount?: number;
    totalPages?: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    refresh: () => Promise<void>;
    loadNextPage: () => Promise<void>;
    loadPrevPage: () => Promise<void>;
    goToPage: (page: number) => Promise<void>;
    clearCache: () => void;
}
export declare function useOptimizedQuery<T = any>(tableName: string, selectFields: string, filters?: Record<string, any>, options?: UseOptimizedQueryOptions): UseOptimizedQueryResult<T>;
/**
 * Hook otimizado específico para propriedades
 */
export declare function useOptimizedProperties(brokerId: string, filters?: {
    status?: string;
    propertyType?: string;
    transactionType?: string;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    search?: string;
}, options?: UseOptimizedQueryOptions): UseOptimizedQueryResult<any>;
/**
 * Hook otimizado para leads
 */
export declare function useOptimizedLeads(brokerId: string, filters?: {
    status?: string;
    source?: string;
    propertyId?: string;
}, options?: UseOptimizedQueryOptions): UseOptimizedQueryResult<any>;
/**
 * Hook otimizado para brokers (SuperAdmin)
 */
export declare function useOptimizedBrokers(filters?: {
    isActive?: boolean;
    planType?: string;
}, options?: UseOptimizedQueryOptions): UseOptimizedQueryResult<any>;
export default useOptimizedQuery;
