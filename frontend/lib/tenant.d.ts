export declare function getHost(): string;
export declare function isDevelopmentHost(host?: string): boolean;
export declare function baseDomain(): string;
export declare function isCustomDomainHost(host?: string): boolean;
import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Resolve o website_slug do broker com base no host atual.
 * Regras conforme especificação:
 * - {slug}.adminimobiliaria.site retorna {slug} (exceto "admin" que é reservado)
 * - domínio customizado: consulta broker_domains para encontrar broker_id e retorna website_slug
 */
export declare function resolveBrokerSlug(supabase: SupabaseClient): Promise<string | null>;
/**
 * Resolve dados completos do broker baseado no host atual
 * Implementa getCurrentBrokerByRequest conforme especificação
 */
export declare function getCurrentBrokerByRequest(supabase: SupabaseClient): Promise<any>;
