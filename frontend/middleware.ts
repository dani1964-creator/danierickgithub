import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Estrutura de roteamento multi-tenant:
 * 
 * 1. Super Admin: adminimobiliaria.site/admin
 * 2. Painel Broker: painel.adminimobiliaria.site/* (autenticação separa cada broker)
 * 3. Vitrine Pública: {slug}.adminimobiliaria.site/* OU dominio-personalizado.com.br/*
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  logger.info(`🔍 Middleware: ${hostname}${pathname}`);
  
  const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';
  
  // Identificar tipo de acesso pelo hostname
  const isMainDomain = hostname === baseDomain || hostname === `www.${baseDomain}`;
  const isPainelSubdomain = hostname === `painel.${baseDomain}`;
  const isVitrineSubdomain = hostname.endsWith(`.${baseDomain}`) && !isPainelSubdomain && !isMainDomain;
  const isCustomDomain = !hostname.includes(baseDomain);
  
  // Rotas especiais
  const isSuperAdminPath = pathname.startsWith('/admin');
  const isPainelPath = pathname.startsWith('/painel');
  const isApiPath = pathname.startsWith('/api');
  const isStaticPath = pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.');
  
  // Recursos estáticos passam direto
  if (isStaticPath) {
    return NextResponse.next();
  }
  
  // APIs passam direto (mas adicionam headers de contexto)
  if (isApiPath) {
    const response = NextResponse.next();
    response.headers.set('x-hostname', hostname);
    response.headers.set('x-base-domain', baseDomain);
    return response;
  }
  
  // ========================================
  // 1. SUPER ADMIN (adminimobiliaria.site/admin)
  // ========================================
  if (isMainDomain && isSuperAdminPath) {
    logger.info('� Super Admin access detected');
    const response = NextResponse.next();
    response.headers.set('x-app-type', 'super-admin');
    response.headers.set('x-hostname', hostname);
    return response;
  }
  
  // ========================================
  // 2. PAINEL BROKER (painel.adminimobiliaria.site/*)
  // ========================================
  if (isPainelSubdomain) {
    logger.info(`🏢 Broker Panel access detected`);
    
    // Redirecionar para /painel/* se não estiver lá
    if (!isPainelPath && pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/painel/dashboard';
      return NextResponse.redirect(url);
    }
    
    const response = NextResponse.next();
    response.headers.set('x-app-type', 'broker-panel');
    response.headers.set('x-hostname', hostname);
    return response;
  }
  
  // ========================================
  // 3. VITRINE PÚBLICA ({slug}.adminimobiliaria.site/* OU dominio-personalizado.com.br/*)
  // ========================================
  if (isVitrineSubdomain || isCustomDomain) {
    let slug = '';
    let customDomain = '';
    
    if (isVitrineSubdomain) {
      // Extrair slug do subdomínio (ex: danierick.adminimobiliaria.site → danierick)
      slug = hostname.split(`.${baseDomain}`)[0];
      logger.info(`🌐 Public Site (subdomain) access - slug: ${slug}`);
    } else {
      // Domínio personalizado
      customDomain = hostname;
      logger.info(`🎨 Public Site (custom domain) access - domain: ${customDomain}`);
    }
    
    const response = NextResponse.next();
    response.headers.set('x-app-type', 'public-site');
    response.headers.set('x-broker-slug', slug);
    response.headers.set('x-custom-domain', customDomain);
    response.headers.set('x-hostname', hostname);
    return response;
  }
  
  // ========================================
  // 4. FALLBACK - Domínio principal sem /admin (homepage do SaaS)
  // ========================================
  if (isMainDomain) {
    logger.info('🏠 Main domain homepage access');
    const response = NextResponse.next();
    response.headers.set('x-app-type', 'saas-homepage');
    response.headers.set('x-hostname', hostname);
    return response;
  }
  
  // Fallback genérico
  logger.warn(`⚠️ Unhandled route pattern: ${hostname}${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplicar middleware a todas as rotas exceto recursos estáticos
    '/((?!_next|favicon.ico|static|.*\\..*).*)',
  ],
};