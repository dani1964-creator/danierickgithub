export type BrokerSEOBase = {
    custom_domain?: string | null;
    website_slug?: string | null;
    canonical_prefer_custom_domain?: boolean | null;
    business_name?: string | null;
};
export declare function getCanonicalBase(broker: BrokerSEOBase, origin: string): string;
export declare function applyTemplate(template: string | null | undefined, values: Record<string, string | number>): string;
/**
 * Gera uma URL pública simples e síncrona para compartilhamento baseado em slug
 * (usado em operações de UI como "Compartilhar" e WhatsApp). Esta função
 * tenta usar a configuração do domínio base quando disponível, e faz um
 * fallback para window.location.origin quando não houver VITE/ENV disponível.
 */
export declare function getPublicUrl(brokerSlug: string, propertySlug: string, pathPrefix?: string): string;
