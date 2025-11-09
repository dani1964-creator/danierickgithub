/**
 * Helper para identificar o contexto da aplicação baseado no hostname
 */

export type AppContext = {
  type: 'super-admin' | 'broker-panel' | 'public-site' | 'saas-homepage';
  brokerSlug?: string;
  customDomain?: string;
  hostname: string;
  baseDomain: string;
};

export function getAppContext(): AppContext {
  if (typeof window === 'undefined') {
    return {
      type: 'saas-homepage',
      hostname: '',
      baseDomain: process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site',
    };
  }

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';

  // 1. Super Admin (adminimobiliaria.site/admin)
  const isMainDomain = hostname === baseDomain || hostname === `www.${baseDomain}`;
  if (isMainDomain && pathname.startsWith('/admin')) {
    return {
      type: 'super-admin',
      hostname,
      baseDomain,
    };
  }

  // 2. Painel Broker (painel.adminimobiliaria.site)
  // Usamos um subdomínio fixo 'painel' para o painel administrativo.
    if (hostname === `painel.${baseDomain}`) {
      return {
        type: 'broker-panel',
        hostname,
        baseDomain,
      };
    }

  // 3. Vitrine Pública - Subdomínio ({slug}.adminimobiliaria.site)
  if (hostname.endsWith(`.${baseDomain}`) && !hostname.includes('.painel.') && !isMainDomain) {
    const brokerSlug = hostname.split(`.${baseDomain}`)[0];
    return {
      type: 'public-site',
      brokerSlug,
      hostname,
      baseDomain,
    };
  }

  // 4. Vitrine Pública - Domínio Personalizado
  if (!hostname.includes(baseDomain)) {
    return {
      type: 'public-site',
      customDomain: hostname,
      hostname,
      baseDomain,
    };
  }

  // Fallback: Homepage do SaaS
  return {
    type: 'saas-homepage',
    hostname,
    baseDomain,
  };
}

/**
 * Verificar se está em contexto de painel do broker
 */
export function isBrokerPanel(): boolean {
  return getAppContext().type === 'broker-panel';
}

/**
 * Verificar se está em contexto de vitrine pública
 */
export function isPublicSite(): boolean {
  return getAppContext().type === 'public-site';
}

/**
 * Verificar se está em contexto de super admin
 */
export function isSuperAdmin(): boolean {
  return getAppContext().type === 'super-admin';
}

/**
 * Obter o slug do broker atual
 */
export function getBrokerSlug(): string | undefined {
  const context = getAppContext();
  return context.brokerSlug;
}

/**
 * Obter o domínio personalizado (se configurado)
 */
export function getCustomDomain(): string | undefined {
  const context = getAppContext();
  return context.customDomain;
}
