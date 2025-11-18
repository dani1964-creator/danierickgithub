/**
 * Utilitários compartilhados para gerenciamento de domínios personalizados
 * 
 * Funções reutilizáveis para validação, normalização e instruções DNS
 * usadas pelas APIs de domínio (configure, provision, verify)
 */

/**
 * Mensagens de erro padronizadas
 */
export const DomainErrors = {
  MISSING_DOMAIN: 'Domain is required',
  INVALID_FORMAT: 'Invalid domain format',
  MISSING_BROKER_ID: 'Broker ID is required',
  DUPLICATE_DOMAIN: 'This domain is already in use by another broker',
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Broker not found',
  UPDATE_FAILED: 'Failed to update broker domain',
  VERIFICATION_FAILED: 'Failed to create verification record',
  DO_VARIABLES_MISSING: 'Digital Ocean variables (DO_ACCESS_TOKEN, DO_APP_ID) not configured',
  DO_API_ERROR: 'Digital Ocean API error',
} as const;

/**
 * Normaliza um domínio removendo protocolo, www e trailing slashes
 * 
 * @param domain - Domínio a ser normalizado
 * @returns Domínio limpo em lowercase
 * 
 * @example
 * cleanDomain('https://www.example.com/') // 'example.com'
 * cleanDomain('HTTP://EXAMPLE.COM') // 'example.com'
 */
export function cleanDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim();
}

/**
 * Valida formato de domínio usando regex
 * 
 * @param domain - Domínio a ser validado
 * @returns true se o formato é válido
 * 
 * @example
 * isValidDomain('example.com') // true
 * isValidDomain('sub.example.com') // true
 * isValidDomain('invalid domain') // false
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
  return domainRegex.test(domain);
}

/**
 * Retorna instruções padronizadas de configuração DNS
 * 
 * @param cnameTarget - Alvo do CNAME (ex: 'adminimobiliaria.site')
 * @returns Objeto com instruções formatadas
 */
export function getDnsInstructions(cnameTarget: string) {
  return {
    message: 'Domain configured successfully. Configure DNS records:',
    dnsRecords: [
      {
        type: 'CNAME',
        name: 'www',
        value: cnameTarget,
        ttl: '1 hour',
      },
      {
        type: 'A',
        name: '@',
        value: '162.159.140.98',
        ttl: '1 hour',
      },
    ],
    note: 'DNS propagation may take 24-48 hours. Use /api/domains/verify to check status.',
  };
}
