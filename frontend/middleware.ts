import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  logger.info(`🔍 Middleware: ${hostname}${pathname}`);
  
  // Identificar tipo de rota
  const isSuperAdmin = pathname.startsWith('/super-admin');
  const isAdmin = pathname.startsWith('/admin');
  const isApi = pathname.startsWith('/api');
  const isPublic = !isSuperAdmin && !isAdmin && !isApi;
  
  // Para super admin, manter rota normal (sem identificação de tenant)
  if (isSuperAdmin) {
    logger.info('📋 Super admin route - bypassing tenant identification');
    return NextResponse.next();
  }
  
  // Para rotas de API internas do Next.js, continuar normalmente
  if (isApi) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-domain', hostname);
    return response;
  }
  
  // Para rotas públicas e admin, identificar tenant
  // Se não há API_URL configurada, bypass tenant identification (modo standalone)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  
  if (!apiUrl) {
    logger.info('⚠️ No API_URL configured - bypassing tenant identification (standalone mode)');
    const response = NextResponse.next();
    response.headers.set('x-tenant-domain', hostname);
    response.headers.set('x-standalone-mode', 'true');
    return response;
  }
  
  try {
    const tenantResponse = await fetch(`${apiUrl}/api/tenant/identify?domain=${encodeURIComponent(hostname)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout de 3 segundos
      signal: AbortSignal.timeout(3000)
    });
    
    if (!tenantResponse.ok) {
      logger.warn(`❌ Tenant not found for domain: ${hostname}`);
      
      // Em produção sem backend, permitir acesso (bypass)
      logger.info('⚠️ Allowing access without tenant data (backend unavailable)');
      const response = NextResponse.next();
      response.headers.set('x-tenant-domain', hostname);
      response.headers.set('x-tenant-error', 'Tenant not found');
      return response;
    }
    
    const tenantData = await tenantResponse.json();
    logger.info(`✅ Tenant identified: ${tenantData.tenant.business_name}`);
    
    // Adicionar dados do tenant aos headers para uso na aplicação
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenantData.tenant.id);
    response.headers.set('x-tenant-data', JSON.stringify(tenantData.tenant));
    response.headers.set('x-tenant-domain', hostname);
    
    // Para rotas admin, verificar se usuário tem acesso (isso será implementado no componente)
    if (isAdmin) {
      response.headers.set('x-admin-required', 'true');
    }
    
    return response;
    
  } catch (error) {
    logger.error('❌ Middleware error:', error);
    
    // Em caso de erro, permitir acesso mas sem dados de tenant
    // A aplicação deve lidar com a ausência de tenant
    logger.info('⚠️ Allowing access without tenant data (error in identification)');
    const response = NextResponse.next();
    response.headers.set('x-tenant-error', 'Failed to identify tenant');
    response.headers.set('x-tenant-domain', hostname);
    
    return response;
  }
}

export const config = {
  matcher: [
    // Aplicar middleware a todas as rotas exceto recursos estáticos
    '/((?!_next|favicon.ico).*)',
  ],
};