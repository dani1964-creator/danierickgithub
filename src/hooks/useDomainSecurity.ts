import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDomainAware } from './useDomainAware';
import { useAuth } from './useAuth';

interface DomainSecurityState {
  isValidDomain: boolean;
  isDomainOwner: boolean;
  canAccessDashboard: boolean;
  shouldRedirectToPublic: boolean;
  loading: boolean;
}

export function useDomainSecurity() {
  const { getCurrentDomain, isCustomDomain } = useDomainAware();
  const { user } = useAuth();
  const [securityState, setSecurityState] = useState<DomainSecurityState>({
    isValidDomain: true,
    isDomainOwner: false,
    canAccessDashboard: false,
    shouldRedirectToPublic: false,
    loading: true
  });

  useEffect(() => {
    const validateDomainSecurity = async () => {
      const currentDomain = getCurrentDomain();
      const isCustom = isCustomDomain();
      
      // If not a custom domain, allow normal flow
      if (!isCustom || !currentDomain) {
        setSecurityState({
          isValidDomain: true,
          isDomainOwner: false,
          canAccessDashboard: true,
          shouldRedirectToPublic: false,
          loading: false
        });
        return;
      }

      // For custom domains, validate ownership
      try {
        if (user) {
          const { data, error } = await supabase.rpc('validate_domain_ownership', {
            p_domain: currentDomain,
            p_user_id: user.id
          });

          if (error) {
            console.error('Error validating domain ownership:', error);
            setSecurityState({
              isValidDomain: false,
              isDomainOwner: false,
              canAccessDashboard: false,
              shouldRedirectToPublic: true,
              loading: false
            });
            return;
          }

          const isDomainOwner = data || false;
          
          setSecurityState({
            isValidDomain: true,
            isDomainOwner,
            canAccessDashboard: isDomainOwner,
            shouldRedirectToPublic: false,
            loading: false
          });

          // Log security check
          if (!isDomainOwner && user) {
            await supabase.from('security_logs').insert({
              event_type: 'unauthorized_domain_access_attempt',
              user_id: user.id,
              metadata: {
                domain: currentDomain,
                user_email: user.email,
                timestamp: new Date().toISOString()
              }
            });
          }
        } else {
          // No user logged in on custom domain
          setSecurityState({
            isValidDomain: true,
            isDomainOwner: false,
            canAccessDashboard: false,
            shouldRedirectToPublic: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Domain security validation error:', error);
        setSecurityState({
          isValidDomain: false,
          isDomainOwner: false,
          canAccessDashboard: false,
          shouldRedirectToPublic: true,
          loading: false
        });
      }
    };

    validateDomainSecurity();
  }, [getCurrentDomain, isCustomDomain, user]);

  const logSecurityEvent = async (eventType: string, metadata: Record<string, any>) => {
    try {
      await supabase.from('security_logs').insert({
        event_type: eventType,
        user_id: user?.id,
        metadata: {
          domain: getCurrentDomain(),
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const validateRouteAccess = (route: string): boolean => {
    const currentDomain = getCurrentDomain();
    const isCustom = isCustomDomain();
    
    // If not custom domain, allow all routes
    if (!isCustom) return true;
    
    // For custom domains, only allow public routes
    const publicRoutes = ['/', '/auth', '/sobre-nos', '/politica-de-privacidade', '/termos-de-uso'];
    const isPublicRoute = publicRoutes.includes(route) || !!route.match(/^\/[^\/]+$/); // Property slugs
    
    // Block administrative routes
    const adminRoutes = ['/dashboard', '/admin', '/settings', '/leads', '/properties', '/realtors'];
    const isAdminRoute = adminRoutes.some(adminRoute => route.startsWith(adminRoute));
    
    if (isAdminRoute && isCustom) {
      logSecurityEvent('blocked_admin_route_access', { 
        route, 
        reason: 'custom_domain_admin_block' 
      });
      return false;
    }
    
    return isPublicRoute;
  };

  return {
    ...securityState,
    validateRouteAccess,
    logSecurityEvent
  };
}