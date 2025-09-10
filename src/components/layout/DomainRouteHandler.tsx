import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDomainAware } from '@/hooks/useDomainAware';
import { useAuth } from '@/hooks/useAuth';
import { useDomainSecurity } from '@/hooks/useDomainSecurity';
import PublicSite from '@/pages/PublicSite';
import Dashboard from '@/pages/Dashboard';
import AuthForm from '@/components/auth/AuthForm';

export const DomainRouteHandler = () => {
  const { getCurrentDomain } = useDomainAware();
  const { isAuthenticated, loading } = useAuth();
  const { validateRouteAccess, canAccessDashboard, shouldRedirectToPublic, logSecurityEvent } = useDomainSecurity();
  const location = useLocation();
  const navigate = useNavigate();
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

  // For custom domains - STRICT ISOLATION
  if (isCustomDomain) {
    const currentRoute = location.pathname;
    
    // Security check: validate route access
    if (!validateRouteAccess(currentRoute)) {
      // Log blocked access attempt
      logSecurityEvent('blocked_route_access', { 
        route: currentRoute, 
        reason: 'custom_domain_restriction' 
      });
      
      // Redirect to public site root
      if (currentRoute !== '/') {
        navigate('/', { replace: true });
        return null;
      }
    }
    
    // Allowed routes for custom domains:
    
    // Root path - public site (NO SLUG ALLOWED)
    if (currentRoute === '/') {
      return <PublicSite forceIgnoreSlug={true} />;
    }
    
    // Auth path - but only for domain owner validation
    if (currentRoute === '/auth') {
      return <AuthForm />;
    }
    
    // Static pages
    if (['/sobre-nos', '/politica-de-privacidade', '/termos-de-uso'].includes(currentRoute)) {
      return null; // Let router handle these
    }
    
    // Property detail pages (single slug only, no broker slug)
    if (currentRoute.match(/^\/[^\/]+$/) && !currentRoute.startsWith('/dashboard') && !currentRoute.startsWith('/admin')) {
      return <PublicSite forceIgnoreSlug={true} />;
    }
    
    // Block everything else and redirect to public site
    navigate('/', { replace: true });
    return null;
  }

  // For Lovable domains - traditional behavior
  // Root shows dashboard if authenticated, otherwise redirect to auth
  if (location.pathname === '/') {
    if (!isAuthenticated) {
      return <AuthForm />;
    }
    
    // Additional security: if user is authenticated but can't access dashboard, redirect
    if (isAuthenticated && !canAccessDashboard && shouldRedirectToPublic) {
      navigate('/', { replace: true });
      return <PublicSite />;
    }
    
    return <Dashboard />;
  }

  // Let the router handle other routes normally
  return null;
};