import React from 'react';
import { PublicQueryHelper } from '@/lib/publicQueries';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook otimizado para páginas públicas
 * Implementa as recomendações do Supabase Assistant IA
 */
export function usePublicData() {
  const [properties, setProperties] = React.useState([]);
  const [broker, setBroker] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;

    const loadPublicData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Implementação conforme Supabase Assistant IA
        // Resolve broker_id primeiro, depois faz queries filtradas
        const [brokerResult, propertiesResult] = await Promise.all([
          PublicQueryHelper.getPublicBroker(),
          PublicQueryHelper.getPublicProperties({ limit: 20 })
        ]);

        if (mounted) {
          if (brokerResult.error || propertiesResult.error) {
            setError(brokerResult.error?.message || propertiesResult.error?.message || 'Erro ao carregar dados');
          } else {
            setBroker(brokerResult.data);
            setProperties(propertiesResult.data || []);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPublicData();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    properties,
    broker,
    loading,
    error,
    refetch: () => {
      PublicQueryHelper.clearCache();
      setLoading(true);
    }
  };
}

/**
 * Hook para verificar se estamos em dashboard autenticado
 * Dashboard deve usar sessão do usuário (RLS vai isolar automaticamente)
 */
export function useDashboardAuth() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Auth error:', error);
          }
          setUser(session?.user || null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Auth check error:', err);
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user || null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}