"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCurrentHost = exports.getPublicRealtors = exports.getPublicBrokerDomains = exports.getPublicBroker = exports.getPublicProperties = exports.PublicQueryHelper = void 0;
const client_1 = require("@/integrations/supabase/client");
const brokerResolver_1 = require("./brokerResolver");
const logger_1 = require("@/lib/logger");
/**
 * Helper para queries públicas seguindo as recomendações do Supabase Assistant IA
 * - Sempre resolve broker_id primeiro via Edge Function host-to-broker
 * - Aplica WHERE broker_id = $resolved_broker_id AND is_active = true
 * - Usa chave anônima (RLS vai filtrar corretamente)
 */
class PublicQueryHelper {
    /**
     * Query público para propriedades do broker atual
     * Implementa: WHERE broker_id = $resolved_broker_id AND is_active = true
     */
    static async getPublicProperties(options = {}) {
        const { limit = 20, offset = 0, orderBy = 'created_at', ascending = false, filters = {} } = options;
        // ✅ Resolver broker_id primeiro (Edge Function + fallback)
        const brokerId = await brokerResolver_1.BrokerResolver.getCurrentBrokerId();
        if (!brokerId) {
            return { data: [], error: { message: 'Broker not found for current host' }, count: 0 };
        }
        // ✅ Query público com filtros recomendados
        let query = client_1.supabase
            .from('properties')
            .select(`
        id, title, description, price, property_type, transaction_type,
        address, city, neighborhood, bedrooms, bathrooms, area_m2,
        parking_spaces, main_image_url, images, features, property_code,
        is_featured, views_count, created_at
      `, { count: 'exact' })
            .eq('broker_id', brokerId) // ✅ Filtro por broker resolvido
            .eq('is_active', true) // ✅ Apenas ativos (RLS já garante, mas mantemos consistência)
            .order(orderBy, { ascending })
            .range(offset, offset + limit - 1);
        // Aplicar filtros adicionais
        if (filters.property_type)
            query = query.eq('property_type', filters.property_type);
        if (filters.transaction_type)
            query = query.eq('transaction_type', filters.transaction_type);
        if (filters.city)
            query = query.ilike('city', `%${filters.city}%`);
        if (filters.min_price)
            query = query.gte('price', filters.min_price);
        if (filters.max_price)
            query = query.lte('price', filters.max_price);
        if (filters.is_featured !== undefined)
            query = query.eq('is_featured', filters.is_featured);
        return await query;
    }
    /**
     * Query público para dados básicos do broker atual
     * Implementa: WHERE id = $resolved_broker_id AND is_active = true
     */
    static async getPublicBroker() {
        const brokerId = await brokerResolver_1.BrokerResolver.getCurrentBrokerId();
        if (!brokerId) {
            return { data: null, error: { message: 'Broker not found for current host' } };
        }
        // ✅ Query público - apenas campos públicos
        const { data, error } = await client_1.supabase
            .from('brokers')
            .select(`
        id, business_name, display_name, website_slug, logo_url,
        primary_color, secondary_color, about_text, footer_text,
        whatsapp_button_color, whatsapp_button_text, background_image_url,
        overlay_color, overlay_opacity, hero_title, hero_subtitle,
        whatsapp_number, site_title, site_description, site_favicon_url,
        site_share_image_url, canonical_prefer_custom_domain,
        robots_index, robots_follow
      `)
            .eq('id', brokerId) // ✅ Filtro por broker resolvido
            .eq('is_active', true) // ✅ Apenas ativos
            .maybeSingle();
        return { data, error };
    }
    /**
     * Query público para domínios customizados do broker atual
     * Implementa: WHERE broker_id = $resolved_broker_id AND is_active = true
     */
    static async getPublicBrokerDomains() {
        const brokerId = await brokerResolver_1.BrokerResolver.getCurrentBrokerId();
        if (!brokerId) {
            return { data: [], error: { message: 'Broker not found for current host' } };
        }
        const { data, error } = await client_1.supabase
            .from('broker_domains')
            .select('domain, is_active')
            .eq('broker_id', brokerId) // ✅ Filtro por broker resolvido
            .eq('is_active', true); // ✅ Apenas ativos
        return { data: data || [], error };
    }
    /**
     * Query público para corretores do broker atual
     * Implementa: WHERE broker_id = $resolved_broker_id AND is_active = true
     */
    static async getPublicRealtors(limit = 10) {
        const brokerId = await brokerResolver_1.BrokerResolver.getCurrentBrokerId();
        if (!brokerId) {
            return { data: [], error: { message: 'Broker not found for current host' } };
        }
        const { data, error } = await client_1.supabase
            .from('realtors')
            .select(`
        id, name, email, phone, bio, profile_image_url,
        whatsapp_number, instagram_url, website_url
      `)
            .eq('broker_id', brokerId) // ✅ Filtro por broker resolvido
            .eq('is_active', true) // ✅ Apenas ativos
            .limit(limit);
        return { data: data || [], error };
    }
    /**
     * Validar se o host atual tem um broker válido
     * Usado pelo DomainRouteHandler para decidir 404 vs página pública
     */
    static async validateCurrentHost() {
        try {
            const brokerId = await brokerResolver_1.BrokerResolver.getCurrentBrokerId();
            return brokerId !== null;
        }
        catch (error) {
            logger_1.logger.warn('Error validating host:', error);
            return false;
        }
    }
    /**
     * Limpar cache (útil para testes ou mudanças)
     */
    static clearCache() {
        brokerResolver_1.BrokerResolver.clearCache();
    }
}
exports.PublicQueryHelper = PublicQueryHelper;
// Exports para compatibilidade
exports.getPublicProperties = PublicQueryHelper.getPublicProperties;
exports.getPublicBroker = PublicQueryHelper.getPublicBroker;
exports.getPublicBrokerDomains = PublicQueryHelper.getPublicBrokerDomains;
exports.getPublicRealtors = PublicQueryHelper.getPublicRealtors;
exports.validateCurrentHost = PublicQueryHelper.validateCurrentHost;
