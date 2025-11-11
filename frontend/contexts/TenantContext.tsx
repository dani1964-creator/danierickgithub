'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { TenantData } from '@/shared/types/tenant';
import { BrokerResolver } from '@/lib/brokerResolver';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  tenant: TenantData | null;
  loading: boolean;
  error: string | null;
  refetchTenant: () => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
  refetchTenant: () => {}
});

interface TenantProviderProps {
  children: ReactNode;
  initialTenant?: TenantData | null;
}

export function TenantProvider({ children, initialTenant }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantData | null>(initialTenant || null);
  const [loading, setLoading] = useState(!initialTenant);
  const [error, setError] = useState<string | null>(null);
  
  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Resolver broker_id usando o BrokerResolver
      const brokerId = await BrokerResolver.resolveBrokerByHost();
      
      if (!brokerId) {
        throw new Error('Imobiliária não encontrada para este domínio');
      }
      
      // Buscar dados do broker no Supabase
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('*')
        .eq('id', brokerId)
        .single();
      
      if (brokerError || !brokerData) {
        throw new Error('Erro ao carregar dados da imobiliária');
      }
      
      // Converter para TenantData (se necessário)
      const tenantData: TenantData = {
        ...brokerData,
        theme_settings: brokerData.theme_settings || {}
      };
      
      setTenant(tenantData);
      applyTenantTheme(tenantData);
      
    } catch (err: any) {
      logger.error('Error loading tenant:', err);
      setError(err.message || 'Erro ao carregar dados da imobiliária');
    } finally {
      setLoading(false);
    }
  };
  
  const applyTenantTheme = (tenantData: TenantData) => {
    if (!tenantData.theme_settings) return;
    
    const theme = tenantData.theme_settings;
    const root = document.documentElement;
    
    // Aplicar cores personalizadas
    if (theme.primary_color) {
      root.style.setProperty('--primary-color', theme.primary_color);
      root.style.setProperty('--color-primary', theme.primary_color);
    }
    
    if (theme.secondary_color) {
      root.style.setProperty('--secondary-color', theme.secondary_color);
      root.style.setProperty('--color-secondary', theme.secondary_color);
    }
    
    // Aplicar título da página
    if (tenantData.site_title) {
      document.title = tenantData.site_title;
    }
    
    // Aplicar favicon se disponível
    if (tenantData.site_favicon_url) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = tenantData.site_favicon_url;
    }
    
  logger.info(`🎨 Applied theme for: ${tenantData.business_name}`);
  };
  
  const refetchTenant = () => {
    loadTenant();
  };
  
  useEffect(() => {
    if (!initialTenant) {
      loadTenant();
    } else {
      applyTenantTheme(initialTenant);
    }
  }, []);
  
  const contextValue: TenantContextType = {
    tenant,
    loading,
    error,
    refetchTenant
  };
  
  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};

// Hook para verificar se estamos em um contexto de tenant válido
export const useRequireTenant = () => {
  const { tenant, loading, error } = useTenant();
  
  const isReady = !loading && !error && tenant;
  const hasError = error || (!loading && !tenant);
  
  return {
    tenant,
    loading,
    error,
    isReady,
    hasError
  };
};