import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDomainAware } from '@/hooks/useDomainAware';
import { useAuth } from '@/hooks/useAuth';
import PublicSite from '@/pages/PublicSite';
import Dashboard from '@/pages/Dashboard';
import AuthForm from '@/components/auth/AuthForm';

export const DomainRouteHandler = () => {
  const { getCurrentDomain } = useDomainAware();
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  
  useEffect(() => {
    const domain = getCurrentDomain();
    setIsCustomDomain(domain !== null);
  }, [getCurrentDomain]);

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

  // For custom domains
  if (isCustomDomain) {
    // Root path shows public site
    if (location.pathname === '/') {
      return <PublicSite />;
    }
    
    // Auth path for admin login
    if (location.pathname === '/auth') {
      return <AuthForm />;
    }
    
    // Property detail pages (without broker slug)
    if (location.pathname.match(/^\/[^\/]+$/)) {
      return <PublicSite />;
    }
  }

  // For Lovable domains - traditional behavior
  // Root shows dashboard if authenticated, otherwise redirect to auth
  if (location.pathname === '/') {
    if (!isAuthenticated) {
      return <AuthForm />;
    }
    return <Dashboard />;
  }

  // Let the router handle other routes normally
  return null;
};