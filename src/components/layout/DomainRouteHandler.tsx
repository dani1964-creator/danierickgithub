import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PublicSite from '@/pages/PublicSite';
import Dashboard from '@/pages/Dashboard';
import AuthForm from '@/components/auth/AuthForm';

export const DomainRouteHandler = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Detectar se é um subdomínio
  const hostname = window.location.hostname;
  const isSubdomain = hostname.includes('.adminimobiliaria.site') && 
                      !hostname.startsWith('www.') && 
                      hostname !== 'adminimobiliaria.site';
  
  const subdomain = isSubdomain ? hostname.split('.')[0] : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-xs text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se é um subdomínio (ex: danierick.adminimobiliaria.site), mostrar PublicSite
  if (isSubdomain && subdomain) {
    return <PublicSite />;
  }

  // Comportamento para diferentes rotas
  if (location.pathname === '/') {
    if (!isAuthenticated) {
      return <AuthForm />;
    }
    return <Dashboard />;
  }

  // Rota /auth sempre mostra o formulário de auth
  if (location.pathname === '/auth') {
    return <AuthForm />;
  }

  // Verificar se a primeira parte do path é um slug de broker
  const pathParts = location.pathname.split('/').filter(Boolean);
  const systemRoutes = ['dashboard', 'auth', 'admin', 'super-admin', 'debug'];
  
  if (pathParts.length > 0 && !systemRoutes.includes(pathParts[0])) {
    return <PublicSite />;
  }

  // Let the router handle other routes normally
  return null;
};