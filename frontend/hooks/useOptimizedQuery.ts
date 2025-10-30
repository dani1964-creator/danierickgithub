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

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { cache, cacheKeys } from '@/utils/cache';

export interface UseOptimizedQueryOptions {
  // Paginação
  page?: number;
  limit?: number;
  
  // Cache
  enableCache?: boolean;
  memoryTTL?: number;
  sessionTTL?: number;
  localTTL?: number;
  
  // Query
  orderBy?: { column: string; ascending?: boolean };
  realtime?: boolean;
  
  // Debug
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
  
  // Métodos
  refresh: () => Promise<void>;
  loadNextPage: () => Promise<void>;
  loadPrevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  clearCache: () => void;
}

export function useOptimizedQuery<T = any>(
  tableName: string,
  selectFields: string,
  filters: Record<string, any> = {},
  options: UseOptimizedQueryOptions = {}
): UseOptimizedQueryResult<T> {
  
  const {
    page = 1,
    limit = 20, // ✅ LIMITE PADRÃO SEMPRE
    enableCache = true,
    memoryTTL = 5,
    sessionTTL = 15,
    localTTL = 60,
    orderBy = { column: 'created_at', ascending: false },
    realtime = false,
    logQueries = process.env.NODE_ENV === 'development'
  } = options;

  // Estados
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  
  // Refs para controle
  const abortController = useRef<AbortController>();
  const realtimeSubscription = useRef<any>();

  // Gerar chave de cache única
  const getCacheKey = useCallback((pageNum: number = currentPage) => {
    return `${tableName}_${selectFields}_${JSON.stringify(filters)}_${pageNum}_${limit}_${JSON.stringify(orderBy)}`;
  }, [tableName, selectFields, filters, limit, orderBy, currentPage]);

  // Função principal de carregamento
  const loadData = useCallback(async (pageNum: number = currentPage, showLoading = true) => {
    try {
      // ✅ CANCELAR REQUISIÇÃO ANTERIOR
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const cacheKey = getCacheKey(pageNum);
      
      // ✅ VERIFICAR CACHE PRIMEIRO
      if (enableCache) {
        const cached = cache.get<{ data: T[], count: number }>(cacheKey, memoryTTL);
        if (cached) {
          setData(cached.data);
          setTotalCount(cached.count);
          setCurrentPage(pageNum);
          setLoading(false);

          if (logQueries) {
            logger.debug(`🚀 CACHE HIT: ${cacheKey} - ${cached.data.length} items`);
          }
          return;
        }
      }

      if (logQueries) {
        logger.debug(`📡 QUERY START: ${tableName} - Page ${pageNum}, Limit ${limit}`);
        logger.debug(`TIMER START: query_${cacheKey}`);
      }

      // ✅ CONSULTA OTIMIZADA - Com casting para evitar problemas de tipos
      let query = (supabase as any)
        .from(tableName)
        .select(selectFields, { count: 'exact' })
        .order(orderBy.column, { ascending: orderBy.ascending })
        .range((pageNum - 1) * limit, pageNum * limit - 1); // ✅ PAGINAÇÃO

      // ✅ APLICAR FILTROS NO SERVIDOR
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.like(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data: result, error: queryError, count } = await query.abortSignal(
        abortController.current.signal
      );

      if (queryError) throw queryError;

      const queryResult = {
        data: result || [],
        count: count || 0
      };

      // ✅ SALVAR NO CACHE
      if (enableCache) {
        cache.set(cacheKey, queryResult, {
          memoryTTL,
          sessionTTL,
          localTTL
        });
      }

      setData(queryResult.data || []);
      setTotalCount(queryResult.count || 0);
      setCurrentPage(pageNum);

      if (logQueries) {
        logger.debug(`TIMER END: query_${cacheKey}`);
        logger.debug(`✅ QUERY SUCCESS: ${queryResult.data.length}/${queryResult.count} items`);
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg = err.message || 'Erro ao carregar dados';
        setError(errorMsg);
        
        if (logQueries) {
          logger.error(`❌ QUERY ERROR: ${tableName}`, err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [
    tableName, 
    selectFields, 
    filters, 
    limit, 
    orderBy, 
    enableCache, 
    memoryTTL, 
    sessionTTL, 
    localTTL,
    logQueries,
    currentPage,
    getCacheKey
  ]);

  // ✅ SETUP REALTIME (OPCIONAL)
  useEffect(() => {
    if (realtime) {
      realtimeSubscription.current = supabase
        .channel(`${tableName}_changes_${Date.now()}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: tableName,
            filter: Object.keys(filters).length > 0 ? 
              Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`).join(',') :
              undefined
          }, 
          (payload) => {
            if (logQueries) {
              logger.debug(`🔄 REALTIME: ${tableName} changed`, payload);
            }
            
            // Invalidar cache e recarregar
            cache.invalidate(getCacheKey().split('_')[0]);
            loadData(currentPage, false);
          }
        )
        .subscribe();

      return () => {
        if (realtimeSubscription.current) {
          supabase.removeChannel(realtimeSubscription.current);
        }
      };
    }
  }, [realtime, tableName, filters, loadData, logQueries, getCacheKey, currentPage]);

  // ✅ CARREGAR DADOS INICIAL
  useEffect(() => {
    loadData(page);
    
    // Cleanup na desmontagem
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [loadData, page]);

  // Métodos de navegação
  const loadNextPage = useCallback(async () => {
    const nextPage = currentPage + 1;
    if (nextPage <= Math.ceil(totalCount / limit)) {
      await loadData(nextPage);
    }
  }, [currentPage, totalCount, limit, loadData]);

  const loadPrevPage = useCallback(async () => {
    const prevPage = currentPage - 1;
    if (prevPage >= 1) {
      await loadData(prevPage);
    }
  }, [currentPage, loadData]);

  const goToPage = useCallback(async (pageNum: number) => {
    const maxPage = Math.ceil(totalCount / limit);
    if (pageNum >= 1 && pageNum <= maxPage) {
      await loadData(pageNum);
    }
  }, [totalCount, limit, loadData]);

  const refresh = useCallback(async () => {
    // Limpar cache antes de recarregar
    cache.invalidate(getCacheKey().split('_')[0]);
    await loadData(currentPage);
  }, [loadData, currentPage, getCacheKey]);

  const clearCache = useCallback(() => {
    cache.invalidate(getCacheKey().split('_')[0]);
  }, [getCacheKey]);

  // Cálculos derivados
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    data,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage,
    refresh,
    loadNextPage,
    loadPrevPage,
    goToPage,
    clearCache
  };
}

/**
 * Hook otimizado específico para propriedades
 */
export function useOptimizedProperties(
  brokerId: string,
  filters: {
    status?: string;
    propertyType?: string;
    transactionType?: string;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    search?: string;
  } = {},
  options: UseOptimizedQueryOptions = {}
) {
  const baseFilters = { broker_id: brokerId };
  
  // Aplicar filtros específicos - usando Record para flexibilidade
  const queryFilters: Record<string, any> = { ...baseFilters };
  if (filters.status) queryFilters.status = filters.status;
  if (filters.propertyType) queryFilters.property_type = filters.propertyType;
  if (filters.transactionType) queryFilters.transaction_type = filters.transactionType;
  if (filters.city) queryFilters.city = filters.city;
  if (filters.priceMin) queryFilters.price_gte = filters.priceMin;
  if (filters.priceMax) queryFilters.price_lte = filters.priceMax;

  return useOptimizedQuery(
    'properties',
    'id, title, description, price, property_type, transaction_type, address, city, neighborhood, bedrooms, bathrooms, area_m2, status, is_featured, main_image_url, property_code, created_at', // ✅ CAMPOS ESPECÍFICOS
    queryFilters,
    {
      limit: 12, // Bom para layouts de grid
      memoryTTL: 3, // Cache curto para dados que mudam
      sessionTTL: 10,
      localTTL: 30,
      ...options
    }
  );
}

/**
 * Hook otimizado para leads
 */
export function useOptimizedLeads(
  brokerId: string,
  filters: {
    status?: string;
    source?: string;
    propertyId?: string;
  } = {},
  options: UseOptimizedQueryOptions = {}
) {
  return useOptimizedQuery(
    'leads',
    'id, name, email, phone, message, status, source, property_id, created_at', // ✅ CAMPOS ESPECÍFICOS
    { broker_id: brokerId, ...filters },
    {
      limit: 15,
      memoryTTL: 2, // Cache muito curto para leads
      sessionTTL: 5,
      localTTL: 15,
      ...options
    }
  );
}

/**
 * Hook otimizado para brokers (SuperAdmin)
 */
export function useOptimizedBrokers(
  filters: {
    isActive?: boolean;
    planType?: string;
  } = {},
  options: UseOptimizedQueryOptions = {}
) {
  return useOptimizedQuery(
    'brokers',
    'id, user_id, business_name, display_name, email, website_slug, is_active, plan_type, created_at', // ✅ CAMPOS ESPECÍFICOS
    filters,
    {
      limit: 25,
      memoryTTL: 10, // Cache maior para admin
      sessionTTL: 30,
      localTTL: 120,
      ...options
    }
  );
}

export default useOptimizedQuery;