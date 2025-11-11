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
  const hostHeader = request.headers.get('host') || '';
  // DigitalOcean App Platform usa headers específicos para passar o host real
  // Prioridade: x-forwarded-host > host header
  const rawXForwardedHost = request.headers.get('x-forwarded-host') || '';
  const xForwardedHost = rawXForwardedHost.split(',')[0].trim();
  
  // Se x-forwarded-host estiver vazio ou for um IP interno (10.x.x.x), tentar outros headers
  let hostname = xForwardedHost || hostHeader || '';
  
  // Se ainda for um IP interno, tentar obter do request URL
  if (!hostname || hostname.match(/^10\.\d+\.\d+\.\d+/)) {
    // Em desenvolvimento ou quando o proxy não passa o header correto,
    // usar o hostname da URL original se disponível
    const urlHost = request.nextUrl.hostname;
    if (urlHost && !urlHost.match(/^10\.\d+\.\d+\.\d+/) && urlHost !== 'localhost') {
      hostname = urlHost;
    }
  }
  
  // Normalizar: remover porta se presente (ex: example.com:3000) e lowercase
  hostname = hostname.split(':')[0].toLowerCase();
  
  const xfFor = request.headers.get('x-forwarded-for') || '';
  const xRealIp = request.headers.get('x-real-ip') || '';
  const xProto = request.headers.get('x-forwarded-proto') || '';
  const pathname = request.nextUrl.pathname;

  logger.info(`🔍 Middleware: hostHeader=${hostHeader} x-forwarded-host=${rawXForwardedHost} resolved-host=${hostname} path=${pathname}`);
  
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
    
    // Permitir rotas específicas do painel
    const isAuthPath = pathname.startsWith('/auth');
    const isDashboardPath = pathname.startsWith('/dashboard');
    const isPainelPath = pathname.startsWith('/painel');
    
    // Se acessar raiz do painel, redirecionar para /auth
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      return NextResponse.redirect(url);
    }
    
    // Bloquear acesso a rotas que não são do painel
    if (!isAuthPath && !isDashboardPath && !isPainelPath && !isApiPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
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
    // Se o usuário acessou a raiz do host público, reescrever para a rota interna '/vitrine'
    // assim o servidor irá entregar a página de vitrine (SSR/SSG) em vez da homepage de marketing.
    const url = request.nextUrl.clone();
    if (url.pathname === '/') {
      // Preferir reescrita interna para entregar a rota de public site sem alterar a URL
      // Assim a URL permanece como `https://<slug>.adminimobiliaria.site/` enquanto
      // o Next.js entrega o conteúdo do componente `pages/public-site`.
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = '/public-site';
      const rewriteResponse = NextResponse.rewrite(rewriteUrl);
      rewriteResponse.headers.set('x-app-type', 'public-site');
      rewriteResponse.headers.set('x-broker-slug', slug);
      rewriteResponse.headers.set('x-custom-domain', customDomain);
      rewriteResponse.headers.set('x-hostname', hostname);
      return rewriteResponse;
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