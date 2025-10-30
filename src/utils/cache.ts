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

import { logger } from '@/lib/logger';

class MultiLevelCache {
  private memoryCache = new Map<string, CacheItem<any>>();
  private readonly MAX_MEMORY_ITEMS = 100; // Limite de itens em memória
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB máximo

  /**
   * Cache em memória (mais rápido, menor TTL)
   * Usado para: Consultas frequentes, dados que mudam rapidamente
   */
  setMemory<T>(key: string, data: T, ttlMinutes = 5): void {
    try {
      // Limpar cache se estiver muito cheio
      if (this.memoryCache.size >= this.MAX_MEMORY_ITEMS) {
        this.clearOldestMemoryItems(10);
      }

      this.memoryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
        key
      });

  logger.debug(`💾 Cache Memory SET: ${key} (TTL: ${ttlMinutes}min)`);
    } catch (error) {
      logger.warn('❌ Erro ao salvar no cache de memória:', error);
    }
  }

  getMemory<T>(key: string): T | null {
    try {
      const item = this.memoryCache.get(key);
      if (!item) return null;

      if (Date.now() - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
        logger.debug(`⏰ Cache Memory EXPIRED: ${key}`);
        return null;
      }

      logger.debug(`✅ Cache Memory HIT: ${key}`);
      return item.data;
    } catch (error) {
      logger.warn('❌ Erro ao buscar no cache de memória:', error);
      return null;
    }
  }

  /**
   * Cache em sessionStorage (dados da sessão)
   * Usado para: Dados que podem persistir durante a sessão
   */
  setSession<T>(key: string, data: T, ttlMinutes = 30): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
        key
      };

      const serialized = JSON.stringify(item);
      
      // Verificar tamanho antes de salvar
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        logger.warn(`⚠️  Item muito grande para sessionStorage: ${key}`);
        return;
      }

      // Limpar espaço se necessário
      if (!this.hasStorageSpace('session', serialized.length)) {
        this.clearExpiredSession();
        this.clearOldestSession(5);
      }

      sessionStorage.setItem(key, serialized);
      logger.debug(`💾 Cache Session SET: ${key} (TTL: ${ttlMinutes}min)`);
    } catch (error) {
      logger.warn('❌ SessionStorage full, clearing old cache:', error);
      this.clearExpiredSession();
      this.clearOldestSession(10);
      
      // Tentar novamente
      try {
        const item: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          ttl: ttlMinutes * 60 * 1000,
          key
        };
        sessionStorage.setItem(key, JSON.stringify(item));
      } catch (secondError) {
        logger.error('❌ Falha crítica no sessionStorage:', secondError);
      }
    }
  }

  getSession<T>(key: string): T | null {
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);

      if (Date.now() - item.timestamp > item.ttl) {
        sessionStorage.removeItem(key);
          logger.debug(`⏰ Cache Session EXPIRED: ${key}`);
        return null;
      }

        logger.debug(`✅ Cache Session HIT: ${key}`);
      return item.data;
    } catch (error) {
        logger.warn('❌ Erro ao buscar no sessionStorage:', error);
      sessionStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Cache em localStorage (dados semi-permanentes)
   * Usado para: Configurações, dados estáticos, listas que mudam pouco
   */
  setLocal<T>(key: string, data: T, ttlHours = 24): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlHours * 60 * 60 * 1000,
        key
      };

      const serialized = JSON.stringify(item);
      
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        logger.warn(`⚠️  Item muito grande para localStorage: ${key}`);
        return;
      }

      if (!this.hasStorageSpace('local', serialized.length)) {
        this.clearExpiredLocal();
        this.clearOldestLocal(5);
      }

      localStorage.setItem(key, serialized);
      logger.debug(`💾 Cache Local SET: ${key} (TTL: ${ttlHours}h)`);
    } catch (error) {
      logger.warn('❌ localStorage full, clearing old cache:', error);
      this.clearExpiredLocal();
      this.clearOldestLocal(10);
      
      try {
        const item: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          ttl: ttlHours * 60 * 60 * 1000,
          key
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch (secondError) {
        logger.error('❌ Falha crítica no localStorage:', secondError);
      }
    }
  }

  getLocal<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);

      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(key);
          logger.debug(`⏰ Cache Local EXPIRED: ${key}`);
        return null;
      }

        logger.debug(`✅ Cache Local HIT: ${key}`);
      return item.data;
    } catch (error) {
        logger.warn('❌ Erro ao buscar no localStorage:', error);
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Busca em cascata: memory -> session -> local
   * Promove dados para caches mais rápidos quando encontrados
   */
  get<T>(key: string, ttlMinutes = 5): T | null {
    // 1. Tentar memória primeiro
    let data = this.getMemory<T>(key);
    if (data) return data;

    // 2. Tentar sessionStorage
    data = this.getSession<T>(key);
    if (data) {
      // Promover para memória
      this.setMemory(key, data, ttlMinutes);
      return data;
    }

    // 3. Tentar localStorage
    data = this.getLocal<T>(key);
    if (data) {
      // Promover para memória e session
      this.setMemory(key, data, ttlMinutes);
      this.setSession(key, data, ttlMinutes * 2);
      return data;
    }

    logger.debug(`❌ Cache MISS: ${key}`);
    return null;
  }

  /**
   * Set em múltiplos níveis baseado na importância dos dados
   */
  set<T>(key: string, data: T, options: {
    memoryTTL?: number;
    sessionTTL?: number;
    localTTL?: number;
  } = {}): void {
    const {
      memoryTTL = 5,
      sessionTTL = 30,
      localTTL = 24
    } = options;

    if (memoryTTL > 0) this.setMemory(key, data, memoryTTL);
    if (sessionTTL > 0) this.setSession(key, data, sessionTTL);
    if (localTTL > 0) this.setLocal(key, data, localTTL);
  }

  // Métodos de limpeza
  private clearOldestMemoryItems(count: number): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    entries.forEach(([key]) => {
      this.memoryCache.delete(key);
    });

    logger.debug(`🧹 Removidos ${count} itens antigos do cache de memória`);
  }

  private hasStorageSpace(type: 'session' | 'local', neededSize: number): boolean {
    try {
      const storage = type === 'session' ? sessionStorage : localStorage;
      const testKey = '__test__';
      storage.setItem(testKey, 'x'.repeat(neededSize));
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private clearExpiredSession(): void {
    const keys = Object.keys(sessionStorage);
    let removed = 0;

    keys.forEach(key => {
      try {
        const item = JSON.parse(sessionStorage.getItem(key) || '');
        if (item.timestamp && Date.now() - item.timestamp > item.ttl) {
          sessionStorage.removeItem(key);
          removed++;
        }
      } catch {
        // Item inválido, remover
        sessionStorage.removeItem(key);
        removed++;
      }
    });

    if (removed > 0) {
      logger.debug(`🧹 Removidos ${removed} itens expirados do sessionStorage`);
    }
  }

  private clearOldestSession(count: number): void {
    const items: Array<{ key: string; timestamp: number }> = [];

    Object.keys(sessionStorage).forEach(key => {
      try {
        const item = JSON.parse(sessionStorage.getItem(key) || '');
        if (item.timestamp) {
          items.push({ key, timestamp: item.timestamp });
        }
      } catch {
        // Item inválido
        items.push({ key, timestamp: 0 });
      }
    });

    items
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, count)
      .forEach(({ key }) => {
        sessionStorage.removeItem(key);
      });

    logger.debug(`🧹 Removidos ${count} itens antigos do sessionStorage`);
  }

  private clearExpiredLocal(): void {
    const keys = Object.keys(localStorage);
    let removed = 0;

    keys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '');
        if (item.timestamp && Date.now() - item.timestamp > item.ttl) {
          localStorage.removeItem(key);
          removed++;
        }
      } catch {
        // Manter outros dados do localStorage que não são cache
        // Não remover automaticamente
      }
    });

    if (removed > 0) {
      logger.debug(`🧹 Removidos ${removed} itens expirados do localStorage`);
    }
  }

  private clearOldestLocal(count: number): void {
    const items: Array<{ key: string; timestamp: number }> = [];

    Object.keys(localStorage).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '');
        if (item.timestamp && item.key) {
          items.push({ key, timestamp: item.timestamp });
        }
      } catch {
        // Não é item de cache, ignorar
      }
    });

    items
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, count)
      .forEach(({ key }) => {
        localStorage.removeItem(key);
      });

    logger.debug(`🧹 Removidos ${count} itens antigos do localStorage`);
  }

  // Invalidação e limpeza
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);

    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Session storage
    Object.keys(sessionStorage).forEach(key => {
      if (regex.test(key)) {
        sessionStorage.removeItem(key);
      }
    });

    // Local storage (cuidado com outros dados)
    Object.keys(localStorage).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '');
        if (item.key && regex.test(key)) {
          localStorage.removeItem(key);
        }
      } catch {
        // Não é item de cache
      }
    });

    logger.debug(`🗑️  Cache invalidado para padrão: ${pattern}`);
  }

  clearAll(): void {
    this.memoryCache.clear();
    
    // Limpar apenas itens de cache do storage
    Object.keys(sessionStorage).forEach(key => {
      try {
        const item = JSON.parse(sessionStorage.getItem(key) || '');
        if (item.key) {
          sessionStorage.removeItem(key);
        }
      } catch {
        // Não é item de cache
      }
    });

    Object.keys(localStorage).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '');
        if (item.key) {
          localStorage.removeItem(key);
        }
      } catch {
        // Não é item de cache
      }
    });

    logger.debug('🗑️  Todo o cache foi limpo');
  }

  getStats(): CacheStats {
    const memoryItems = this.memoryCache.size;
    
    let sessionItems = 0;
    let sessionSize = 0;
    Object.keys(sessionStorage).forEach(key => {
      try {
        const item = sessionStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.key) {
            sessionItems++;
            sessionSize += item.length;
          }
        }
      } catch {}
    });

    let localItems = 0;
    let localSize = 0;
    Object.keys(localStorage).forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.key) {
            localItems++;
            localSize += item.length;
          }
        }
      } catch {}
    });

    return {
      memoryItems,
      sessionItems,
      localItems,
      memorySize: `${(JSON.stringify([...this.memoryCache.values()]).length / 1024).toFixed(1)} KB`,
      sessionSize: `${(sessionSize / 1024).toFixed(1)} KB`,
      localSize: `${(localSize / 1024).toFixed(1)} KB`
    };
  }

  // Limpeza automática periódica
  startAutomaticCleanup(intervalMinutes = 5): () => void {
    const interval = setInterval(() => {
  logger.debug('🧹 Iniciando limpeza automática do cache...');
      
      // Limpar expirados
      this.clearExpiredSession();
      this.clearExpiredLocal();
      
      // Limpar memória se muito cheia
      if (this.memoryCache.size > this.MAX_MEMORY_ITEMS * 0.8) {
        this.clearOldestMemoryItems(20);
      }
      
  const stats = this.getStats();
  logger.debug('📊 Stats do cache:', stats);
      
    }, intervalMinutes * 60 * 1000);

    // Retorna função para parar a limpeza
    return () => clearInterval(interval);
  }
}

// Instância global do cache
export const cache = new MultiLevelCache();

// Iniciar limpeza automática
if (typeof window !== 'undefined') {
  cache.startAutomaticCleanup(10); // A cada 10 minutos
}

/**
 * Utilitários para gerar chaves de cache consistentes
 */
export const cacheKeys = {
  // Propriedades
  properties: (brokerId: string, filters?: any, page = 1, limit = 20) => 
    `properties_${brokerId}_${JSON.stringify(filters || {})}_${page}_${limit}`,
  
  property: (id: string) => `property_${id}`,
  
  // Brokers
  brokers: (page = 1, limit = 20) => `brokers_${page}_${limit}`,
  broker: (id: string) => `broker_${id}`,
  brokerBySlug: (slug: string) => `broker_slug_${slug}`,
  
  // Dashboard
  dashboard: (brokerId: string) => `dashboard_${brokerId}`,
  dashboardStats: (brokerId: string) => `dashboard_stats_${brokerId}`,
  
  // Leads
  leads: (brokerId: string, page = 1, limit = 20) => `leads_${brokerId}_${page}_${limit}`,
  
  // Configurações
  settings: (brokerId: string) => `settings_${brokerId}`,
  
  // Listas estáticas
  propertyTypes: () => 'property_types',
  cities: () => 'cities',
  neighborhoods: (city: string) => `neighborhoods_${city}`
};

export default cache;