import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  console.log(`🔍 Middleware: ${hostname}${pathname}`);
  
  // Identificar tipo de rota
  const isSuperAdmin = pathname.startsWith('/super-admin');
  const isAdmin = pathname.startsWith('/admin');
  const isApi = pathname.startsWith('/api');
  const isPublic = !isSuperAdmin && !isAdmin && !isApi;
  
  // Para super admin, manter rota normal (sem identificação de tenant)
  if (isSuperAdmin) {
    console.log('📋 Super admin route - bypassing tenant identification');
    return NextResponse.next();
  }
  
  // Para rotas de API internas do Next.js, continuar normalmente
  if (isApi) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-domain', hostname);
    return response;
  }
  
  // Para rotas públicas e admin, identificar tenant
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080';
    
    const tenantResponse = await fetch(`${apiUrl}/api/tenant/identify?domain=${encodeURIComponent(hostname)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000)
    });
    
    if (!tenantResponse.ok) {
      console.log(`❌ Tenant not found for domain: ${hostname}`);
      
      // Se for rota admin sem tenant, redirecionar para erro
      if (isAdmin) {
        return NextResponse.redirect(new URL('/tenant-not-found', request.url));
      }
      
      // Para rotas públicas, mostrar página de erro amigável
      return NextResponse.redirect(new URL('/site-not-found', request.url));
    }
    
    const tenantData = await tenantResponse.json();
    console.log(`✅ Tenant identified: ${tenantData.tenant.business_name}`);
    
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
    console.error('❌ Middleware error:', error);
    
    // Em caso de erro, permitir acesso mas sem dados de tenant
    // A aplicação deve lidar com a ausência de tenant
    const response = NextResponse.next();
    response.headers.set('x-tenant-error', 'Failed to identify tenant');
    
    return response;
  }
}

export const config = {
  matcher: [
    // Aplicar middleware a todas as rotas exceto recursos estáticos
    '/((?!_next|favicon.ico).*)',
  ],
};