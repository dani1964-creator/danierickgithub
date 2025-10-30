import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDomainAware } from '@/hooks/useDomainAware';
import { useBrokerResolver } from '@/lib/brokerResolver';
import { validateCurrentHost } from '@/lib/publicQueries';
import { useState, useEffect } from 'react';
import PublicSite from '@/pages/PublicSite';
import Dashboard from '@/pages/Dashboard';
import AuthForm from '@/components/auth/AuthForm';
import BrokerNotFound from '@/pages/BrokerNotFound';
import { isDevelopmentHost } from '@/lib/tenant';
import { logger } from '@/lib/logger';

export const DomainRouteHandler = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { getBrokerByDomainOrSlug } = useDomainAware();
  const { brokerId, loading: brokerResolverLoading } = useBrokerResolver();
  const location = useLocation();
  const [broker, setBroker] = useState(null);
  const [isDevHost, setIsDevHost] = useState(false);

  // Verificar se existe broker para o host atual
  useEffect(() => {
    const checkBroker = async () => {
      try {
        // Verificar se é ambiente de desenvolvimento
        const isDev = isDevelopmentHost();
        setIsDevHost(isDev);
        
        // Se é desenvolvimento, não precisamos de broker - usar modo dashboard
        if (isDev) {
          setBroker(null); // Sem broker específico
          return;
        }

        // Produção: usar validação otimizada (implementa Edge Function + fallback)
        const hasValidBroker = await validateCurrentHost();
        if (hasValidBroker) {
          const brokerData = await getBrokerByDomainOrSlug();
          setBroker(brokerData);
        } else {
          setBroker(null);
        }
      } catch (error) {
        logger.error('Error checking broker:', error);
        setBroker(null);
      }
    };

    if (!brokerResolverLoading) {
      checkBroker();
    }
  }, [brokerResolverLoading, getBrokerByDomainOrSlug]);

  // Loading state
  if (authLoading || brokerResolverLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-xs text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Comportamento baseado na rota e presença de broker
  if (location.pathname === '/') {
    // Ambiente de desenvolvimento: ir direto para auth/dashboard
    if (isDevHost) {
      if (!isAuthenticated) {
        return <AuthForm />;
      }
      return <Dashboard />;
    }

    // Produção: Se não há broker válido para este host, mostrar 404
    if (!broker) {
      return <BrokerNotFound />;
    }

    // Se há broker válido mas usuário não está autenticado, mostrar site público
    if (!isAuthenticated) {
      return <PublicSite />;
    }

    // Se há broker válido e usuário autenticado, verificar se é o mesmo broker
    // Por enquanto, mostrar dashboard (auth já valida se é o broker correto)
    return <Dashboard />;
  }

  // Para rota /auth, verificar se há broker válido
  if (location.pathname === '/auth') {
    // Ambiente de desenvolvimento: sempre permitir auth
    if (isDevHost) {
      return <AuthForm />;
    }
    
    // Produção: requer broker válido
    if (!broker) {
      return <BrokerNotFound />;
    }
    return <AuthForm />;
  }

  // Para outras rotas, deixar o router tratar normalmente
  // mas se não há broker válido e é uma rota que requer broker, mostrar 404
  // NOTA: /admin (SuperAdmin) não requer broker específico - funciona globalmente
  const routesRequiringBroker = ['/dashboard'];
  const requiresBroker = routesRequiringBroker.some(route => 
    location.pathname.startsWith(route)
  );

  // Ambiente de desenvolvimento: sempre permitir rotas administrativas
  if (requiresBroker && !isDevHost && !broker) {
    return <BrokerNotFound />;
  }

  return null;
};