"use strict";
/**
 * Sistema de Cache Multi-Nível para Redução de Egress do Supabase
 *
 * PROBLEMA: Consumindo >4GB/mês no plano gratuito (limite: 500MB)
 * SOLUÇÃO: Cache em memória, sessionStorage e localStorage
 *
 * IMPACTO ESPERADO: Redução de 80-90% no tráfego de dados
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheKeys = exports.cache = void 0;
const logger_1 = require("@/lib/logger");
class MultiLevelCache {
    constructor() {
        this.memoryCache = new Map();
        this.MAX_MEMORY_ITEMS = 100; // Limite de itens em memória
        this.MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB máximo
    }
    /**
     * Cache em memória (mais rápido, menor TTL)
     * Usado para: Consultas frequentes, dados que mudam rapidamente
     */
    setMemory(key, data, ttlMinutes = 5) {
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
            logger_1.logger.debug(`💾 Cache Memory SET: ${key} (TTL: ${ttlMinutes}min)`);
        }
        catch (error) {
            logger_1.logger.warn('❌ Erro ao salvar no cache de memória:', error);
        }
    }
    getMemory(key) {
        try {
            const item = this.memoryCache.get(key);
            if (!item)
                return null;
            if (Date.now() - item.timestamp > item.ttl) {
                this.memoryCache.delete(key);
                logger_1.logger.debug(`⏰ Cache Memory EXPIRED: ${key}`);
                return null;
            }
            logger_1.logger.debug(`✅ Cache Memory HIT: ${key}`);
            return item.data;
        }
        catch (error) {
            logger_1.logger.warn('❌ Erro ao buscar no cache de memória:', error);
            return null;
        }
    }
    /**
     * Cache em sessionStorage (dados da sessão)
     * Usado para: Dados que podem persistir durante a sessão
     */
    setSession(key, data, ttlMinutes = 30) {
        try {
            const item = {
                data,
                timestamp: Date.now(),
                ttl: ttlMinutes * 60 * 1000,
                key
            };
            const serialized = JSON.stringify(item);
            // Verificar tamanho antes de salvar
            if (serialized.length > this.MAX_STORAGE_SIZE) {
                logger_1.logger.warn(`⚠️  Item muito grande para sessionStorage: ${key}`);
                return;
            }
            // Limpar espaço se necessário
            if (!this.hasStorageSpace('session', serialized.length)) {
                this.clearExpiredSession();
                this.clearOldestSession(5);
            }
            sessionStorage.setItem(key, serialized);
            logger_1.logger.debug(`💾 Cache Session SET: ${key} (TTL: ${ttlMinutes}min)`);
        }
        catch (error) {
            logger_1.logger.warn('❌ SessionStorage full, clearing old cache:', error);
            this.clearExpiredSession();
            this.clearOldestSession(10);
            // Tentar novamente
            try {
                const item = {
                    data,
                    timestamp: Date.now(),
                    ttl: ttlMinutes * 60 * 1000,
                    key
                };
                sessionStorage.setItem(key, JSON.stringify(item));
            }
            catch (secondError) {
                logger_1.logger.error('❌ Falha crítica no sessionStorage:', secondError);
            }
        }
    }
    getSession(key) {
        try {
            const stored = sessionStorage.getItem(key);
            if (!stored)
                return null;
            const item = JSON.parse(stored);
            if (Date.now() - item.timestamp > item.ttl) {
                sessionStorage.removeItem(key);
                logger_1.logger.debug(`⏰ Cache Session EXPIRED: ${key}`);
                return null;
            }
            logger_1.logger.debug(`✅ Cache Session HIT: ${key}`);
            return item.data;
        }
        catch (error) {
            logger_1.logger.warn('❌ Erro ao buscar no sessionStorage:', error);
            sessionStorage.removeItem(key);
            return null;
        }
    }
    /**
     * Cache em localStorage (dados semi-permanentes)
     * Usado para: Configurações, dados estáticos, listas que mudam pouco
     */
    setLocal(key, data, ttlHours = 24) {
        try {
            const item = {
                data,
                timestamp: Date.now(),
                ttl: ttlHours * 60 * 60 * 1000,
                key
            };
            const serialized = JSON.stringify(item);
            if (serialized.length > this.MAX_STORAGE_SIZE) {
                logger_1.logger.warn(`⚠️  Item muito grande para localStorage: ${key}`);
                return;
            }
            if (!this.hasStorageSpace('local', serialized.length)) {
                this.clearExpiredLocal();
                this.clearOldestLocal(5);
            }
            localStorage.setItem(key, serialized);
            logger_1.logger.debug(`💾 Cache Local SET: ${key} (TTL: ${ttlHours}h)`);
        }
        catch (error) {
            logger_1.logger.warn('❌ localStorage full, clearing old cache:', error);
            this.clearExpiredLocal();
            this.clearOldestLocal(10);
            try {
                const item = {
                    data,
                    timestamp: Date.now(),
                    ttl: ttlHours * 60 * 60 * 1000,
                    key
                };
                localStorage.setItem(key, JSON.stringify(item));
            }
            catch (secondError) {
                logger_1.logger.error('❌ Falha crítica no localStorage:', secondError);
            }
        }
    }
    getLocal(key) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored)
                return null;
            const item = JSON.parse(stored);
            if (Date.now() - item.timestamp > item.ttl) {
                localStorage.removeItem(key);
                logger_1.logger.debug(`⏰ Cache Local EXPIRED: ${key}`);
                return null;
            }
            logger_1.logger.debug(`✅ Cache Local HIT: ${key}`);
            return item.data;
        }
        catch (error) {
            logger_1.logger.warn('❌ Erro ao buscar no localStorage:', error);
            localStorage.removeItem(key);
            return null;
        }
    }
    /**
     * Busca em cascata: memory -> session -> local
     * Promove dados para caches mais rápidos quando encontrados
     */
    get(key, ttlMinutes = 5) {
        // 1. Tentar memória primeiro
        let data = this.getMemory(key);
        if (data)
            return data;
        // 2. Tentar sessionStorage
        data = this.getSession(key);
        if (data) {
            // Promover para memória
            this.setMemory(key, data, ttlMinutes);
            return data;
        }
        // 3. Tentar localStorage
        data = this.getLocal(key);
        if (data) {
            // Promover para memória e session
            this.setMemory(key, data, ttlMinutes);
            this.setSession(key, data, ttlMinutes * 2);
            return data;
        }
        logger_1.logger.debug(`❌ Cache MISS: ${key}`);
        return null;
    }
    /**
     * Set em múltiplos níveis baseado na importância dos dados
     */
    set(key, data, options = {}) {
        const { memoryTTL = 5, sessionTTL = 30, localTTL = 24 } = options;
        if (memoryTTL > 0)
            this.setMemory(key, data, memoryTTL);
        if (sessionTTL > 0)
            this.setSession(key, data, sessionTTL);
        if (localTTL > 0)
            this.setLocal(key, data, localTTL);
    }
    // Métodos de limpeza
    clearOldestMemoryItems(count) {
        const entries = Array.from(this.memoryCache.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp)
            .slice(0, count);
        entries.forEach(([key]) => {
            this.memoryCache.delete(key);
        });
        logger_1.logger.debug(`🧹 Removidos ${count} itens antigos do cache de memória`);
    }
    hasStorageSpace(type, neededSize) {
        try {
            const storage = type === 'session' ? sessionStorage : localStorage;
            const testKey = '__test__';
            storage.setItem(testKey, 'x'.repeat(neededSize));
            storage.removeItem(testKey);
            return true;
        }
        catch {
            return false;
        }
    }
    clearExpiredSession() {
        const keys = Object.keys(sessionStorage);
        let removed = 0;
        keys.forEach(key => {
            try {
                const item = JSON.parse(sessionStorage.getItem(key) || '');
                if (item.timestamp && Date.now() - item.timestamp > item.ttl) {
                    sessionStorage.removeItem(key);
                    removed++;
                }
            }
            catch {
                // Item inválido, remover
                sessionStorage.removeItem(key);
                removed++;
            }
        });
        if (removed > 0) {
            logger_1.logger.debug(`🧹 Removidos ${removed} itens expirados do sessionStorage`);
        }
    }
    clearOldestSession(count) {
        const items = [];
        Object.keys(sessionStorage).forEach(key => {
            try {
                const item = JSON.parse(sessionStorage.getItem(key) || '');
                if (item.timestamp) {
                    items.push({ key, timestamp: item.timestamp });
                }
            }
            catch {
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
        logger_1.logger.debug(`🧹 Removidos ${count} itens antigos do sessionStorage`);
    }
    clearExpiredLocal() {
        const keys = Object.keys(localStorage);
        let removed = 0;
        keys.forEach(key => {
            try {
                const item = JSON.parse(localStorage.getItem(key) || '');
                if (item.timestamp && Date.now() - item.timestamp > item.ttl) {
                    localStorage.removeItem(key);
                    removed++;
                }
            }
            catch {
                // Manter outros dados do localStorage que não são cache
                // Não remover automaticamente
            }
        });
        if (removed > 0) {
            logger_1.logger.debug(`🧹 Removidos ${removed} itens expirados do localStorage`);
        }
    }
    clearOldestLocal(count) {
        const items = [];
        Object.keys(localStorage).forEach(key => {
            try {
                const item = JSON.parse(localStorage.getItem(key) || '');
                if (item.timestamp && item.key) {
                    items.push({ key, timestamp: item.timestamp });
                }
            }
            catch {
                // Não é item de cache, ignorar
            }
        });
        items
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(0, count)
            .forEach(({ key }) => {
            localStorage.removeItem(key);
        });
        logger_1.logger.debug(`🧹 Removidos ${count} itens antigos do localStorage`);
    }
    // Invalidação e limpeza
    invalidate(pattern) {
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
            }
            catch {
                // Não é item de cache
            }
        });
        logger_1.logger.info(`🗑️  Cache invalidado para padrão: ${pattern}`);
    }
    clearAll() {
        this.memoryCache.clear();
        // Limpar apenas itens de cache do storage
        Object.keys(sessionStorage).forEach(key => {
            try {
                const item = JSON.parse(sessionStorage.getItem(key) || '');
                if (item.key) {
                    sessionStorage.removeItem(key);
                }
            }
            catch {
                // Não é item de cache
            }
        });
        Object.keys(localStorage).forEach(key => {
            try {
                const item = JSON.parse(localStorage.getItem(key) || '');
                if (item.key) {
                    localStorage.removeItem(key);
                }
            }
            catch {
                // Não é item de cache
            }
        });
        logger_1.logger.info('🗑️  Todo o cache foi limpo');
    }
    getStats() {
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
            }
            catch { }
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
            }
            catch { }
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
    startAutomaticCleanup(intervalMinutes = 5) {
        const interval = setInterval(() => {
            logger_1.logger.info('🧹 Iniciando limpeza automática do cache...');
            // Limpar expirados
            this.clearExpiredSession();
            this.clearExpiredLocal();
            // Limpar memória se muito cheia
            if (this.memoryCache.size > this.MAX_MEMORY_ITEMS * 0.8) {
                this.clearOldestMemoryItems(20);
            }
            const stats = this.getStats();
            logger_1.logger.debug('📊 Stats do cache:', stats);
        }, intervalMinutes * 60 * 1000);
        // Retorna função para parar a limpeza
        return () => clearInterval(interval);
    }
}
// Instância global do cache
exports.cache = new MultiLevelCache();
// Iniciar limpeza automática
if (typeof window !== 'undefined') {
    exports.cache.startAutomaticCleanup(10); // A cada 10 minutos
}
/**
 * Utilitários para gerar chaves de cache consistentes
 */
exports.cacheKeys = {
    // Propriedades
    properties: (brokerId, filters, page = 1, limit = 20) => `properties_${brokerId}_${JSON.stringify(filters || {})}_${page}_${limit}`,
    property: (id) => `property_${id}`,
    // Brokers
    brokers: (page = 1, limit = 20) => `brokers_${page}_${limit}`,
    broker: (id) => `broker_${id}`,
    brokerBySlug: (slug) => `broker_slug_${slug}`,
    // Dashboard
    dashboard: (brokerId) => `dashboard_${brokerId}`,
    dashboardStats: (brokerId) => `dashboard_stats_${brokerId}`,
    // Leads
    leads: (brokerId, page = 1, limit = 20) => `leads_${brokerId}_${page}_${limit}`,
    // Configurações
    settings: (brokerId) => `settings_${brokerId}`,
    // Listas estáticas
    propertyTypes: () => 'property_types',
    cities: () => 'cities',
    neighborhoods: (city) => `neighborhoods_${city}`
};
exports.default = exports.cache;
