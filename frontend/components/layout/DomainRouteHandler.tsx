import { useLocation } from 'react-router-dom';
import { useAuth } from '@shared/hooks/useAuth';
import PublicSite from '@/pages/PublicSite';
import Dashboard from '@/pages/Dashboard';
import AuthForm from '@/components/auth/AuthForm';

export const DomainRouteHandler = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

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

  // Comportamento simplificado: na raiz, mostra dashboard se autenticado, senão tela de login
  if (location.pathname === '/') {
    if (!isAuthenticated) {
      return <AuthForm />;
    }
    return <Dashboard />;
  }

  // Let the router handle other routes normally
  return null;
};