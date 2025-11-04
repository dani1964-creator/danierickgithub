/**
 * Helper para queries públicas seguindo as recomendações do Supabase Assistant IA
 * - Sempre resolve broker_id primeiro via Edge Function host-to-broker
 * - Aplica WHERE broker_id = $resolved_broker_id AND is_active = true
 * - Usa chave anônima (RLS vai filtrar corretamente)
 */
export declare class PublicQueryHelper {
    /**
     * Query público para propriedades do broker atual
     * Implementa: WHERE broker_id = $resolved_broker_id AND is_active = true
     */
    static getPublicProperties(options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
        ascending?: boolean;
        filters?: {
            property_type?: string;
            transaction_type?: string;
            city?: string;
            min_price?: number;
            max_price?: number;
            is_featured?: boolean;
        };
    }): Promise<any>;
    /**
     * Query público para dados básicos do broker atual
     * Implementa: WHERE id = $resolved_broker_id AND is_active = true
     */
    static getPublicBroker(): Promise<{
        data: any;
        error: any;
    }>;
    /**
     * Query público para domínios customizados do broker atual
     * Implementa: WHERE broker_id = $resolved_broker_id AND is_active = true
     */
    static getPublicBrokerDomains(): Promise<{
        data: any;
        error: any;
    }>;
    /**
     * Query público para corretores do broker atual
     * Implementa: WHERE broker_id = $resolved_broker_id AND is_active = true
     */
    static getPublicRealtors(limit?: number): Promise<{
        data: any;
        error: any;
    }>;
    /**
     * Validar se o host atual tem um broker válido
     * Usado pelo DomainRouteHandler para decidir 404 vs página pública
     */
    static validateCurrentHost(): Promise<boolean>;
    /**
     * Limpar cache (útil para testes ou mudanças)
     */
    static clearCache(): void;
}
export declare const getPublicProperties: typeof PublicQueryHelper.getPublicProperties;
export declare const getPublicBroker: typeof PublicQueryHelper.getPublicBroker;
export declare const getPublicBrokerDomains: typeof PublicQueryHelper.getPublicBrokerDomains;
export declare const getPublicRealtors: typeof PublicQueryHelper.getPublicRealtors;
export declare const validateCurrentHost: typeof PublicQueryHelper.validateCurrentHost;
