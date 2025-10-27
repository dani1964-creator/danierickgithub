import { useMemo } from 'react';
import { useDomainAware } from './useDomainAware';

export interface SubdomainInfo {
  isSubdomain: boolean;
  subdomain: string | null;
  rootDomain: string;
  fullDomain: string;
  slug: string | null;
}

export const useSubdomainDetection = (): SubdomainInfo => {
  const { isCustomDomain } = useDomainAware();

  return useMemo(() => {
    const fullDomain = window.location.hostname;
    const rootDomain = 'adminimobiliaria.site';
    
    // Se é um domínio personalizado, não é subdomínio do nosso sistema
    if (isCustomDomain()) {
      return {
        isSubdomain: false,
        subdomain: null,
        rootDomain: fullDomain,
        fullDomain,
        slug: null
      };
    }

    // Verifica se é um subdomínio do nosso domínio principal
    if (fullDomain.endsWith(`.${rootDomain}`)) {
      const subdomain = fullDomain.replace(`.${rootDomain}`, '');
      
      // Não considera 'www' como subdomínio de tenant
      if (subdomain === 'www' || subdomain === '') {
        return {
          isSubdomain: false,
          subdomain: null,
          rootDomain,
          fullDomain,
          slug: null
        };
      }

      return {
        isSubdomain: true,
        subdomain,
        rootDomain,
        fullDomain,
        slug: subdomain // O subdomínio é o slug do tenant
      };
    }

    // Domínio raiz ou localhost
    return {
      isSubdomain: false,
      subdomain: null,
      rootDomain,
      fullDomain,
      slug: null
    };
  }, [isCustomDomain]);
};

export const useCurrentTenantSlug = (): string | null => {
  const subdomainInfo = useSubdomainDetection();
  const { getBrokerByDomainOrSlug } = useDomainAware();
  
  return useMemo(() => {
    // Se é subdomínio, usar o subdomínio como slug
    if (subdomainInfo.isSubdomain && subdomainInfo.slug) {
      return subdomainInfo.slug;
    }

    // Se não é subdomínio, tentar extrair slug da URL
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    
    // Se a primeira parte do path não é uma rota conhecida do sistema, é um slug
    const systemRoutes = [
      'dashboard', 'auth', 'admin', 'super-admin', 'debug',
      'sobre-nos', 'politica-de-privacidade', 'termos-de-uso'
    ];
    
    if (pathParts.length > 0 && !systemRoutes.includes(pathParts[0])) {
      return pathParts[0];
    }

    return null;
  }, [subdomainInfo, getBrokerByDomainOrSlug]);
};