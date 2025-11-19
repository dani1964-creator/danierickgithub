import React from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve broker_id baseado no host atual usando Edge Function ou fallback local
 * Implementa a recomendação das novas políticas RLS
 */
export class BrokerResolver {
  private static cache = new Map<string, { brokerId: string | null; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Resolve broker_id para o host atual
   * Usa resolução local direta (Edge Function desabilitada temporariamente)
   */
  static async resolveBrokerByHost(host?: string): Promise<string | null> {
    const targetHost = host || window.location.host.toLowerCase();
    
    // Verificar cache primeiro
    const cached = this.cache.get(targetHost);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.brokerId;
    }

    try {
      // Usar resolução local direta (mais rápido e sem CORS)
      const brokerId = await this.resolveViaLocalQuery(targetHost);
      
      // Cache o resultado
      this.cache.set(targetHost, { brokerId, timestamp: Date.now() });
      
      return brokerId;
    } catch (error) {
      logger.error('Erro ao resolver broker por host:', error);
      return null;
    }
  }

  /**
   * Resolve localmente usando queries diretas ao Supabase
   */
  private static async resolveViaLocalQuery(host: string): Promise<string | null> {
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || process.env.NEXT_PUBLIC_BASE_DOMAIN || '')?.toLowerCase() || 'adminimobiliaria.site';
    
    try {
      // Subdomínio *.adminimobiliaria.site
      if (host.endsWith(`.${baseDomain}`)) {
        const subdomain = host.slice(0, -(baseDomain.length + 1));
        
        // 'admin' e 'painel' são reservados
        if (subdomain === 'admin' || subdomain === 'painel') return null;
        
        // Buscar por subdomain OU website_slug
        const { data, error } = await supabase
          .from('brokers')
          .select('id')
          .or(`subdomain.eq.${subdomain},website_slug.eq.${subdomain}`)
          .eq('is_active', true)
          .maybeSingle();
        
        if (error) throw error;
        return data?.id || null;
      }

      // Domínio customizado - Verificar campo custom_domain na tabela brokers
      const { data: customDomainBroker, error: customDomainError } = await supabase
        .from('brokers')
        .select('id')
        .eq('custom_domain', host)
        .eq('is_active', true)
        .maybeSingle();

      if (customDomainError) throw customDomainError;
      if (customDomainBroker?.id) {
        return customDomainBroker.id;
      }

      // Fallback: Verificar broker_domains (para compatibilidade com domínios antigos)
      const { data: domainData, error: domainError } = await supabase
        .from('broker_domains')
        .select('broker_id')
        .eq('domain', host)
        .eq('is_active', true)
        .maybeSingle();

      if (domainError) throw domainError;
      
      if (domainData?.broker_id) {
        // Verificar se o broker está ativo
        const { data: brokerData, error: brokerError } = await supabase
          .from('brokers')
          .select('id')
          .eq('id', domainData.broker_id)
          .eq('is_active', true)
          .maybeSingle();

        if (brokerError) throw brokerError;
        return brokerData?.id || null;
      }

      return null;
    } catch (error) {
      logger.error('Erro na resolução local do broker:', error);
      return null;
    }
  }

  /**
   * Limpar cache (útil para testes ou mudanças de configuração)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Helper para obter broker_id atual do request/contexto
   * Implementa a recomendação getCurrentBrokerId(req)
   */
  static async getCurrentBrokerId(): Promise<string | null> {
    return this.resolveBrokerByHost();
  }
}

/**
 * Hook React para resolver broker baseado no host
 * OTIMIZADO: conforme recomendações do Supabase Assistant IA
 * - Tenta Edge Function primeiro
 * - Fallback para resolução local
 * - Cache para performance
 */
export function useBrokerResolver() {
  const [brokerId, setBrokerId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const resolveBroker = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const resolvedBrokerId = await BrokerResolver.getCurrentBrokerId();
        
        if (mounted) {
          setBrokerId(resolvedBrokerId);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao resolver broker');
          setBrokerId(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    resolveBroker();

    return () => {
      mounted = false;
    };
  }, []);

  return { 
    brokerId, 
    loading, 
    error, 
    refetch: () => {
      BrokerResolver.clearCache();
      return BrokerResolver.getCurrentBrokerId();
    }
  };
}

// Re-export para compatibilidade
export const getCurrentBrokerId = BrokerResolver.getCurrentBrokerId;
