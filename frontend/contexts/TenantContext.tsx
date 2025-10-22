'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TenantData } from '../types/tenant';

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
      
      // Primeiro, tentar obter do header (setado pelo middleware)
      const tenantHeader = document.querySelector('meta[name="x-tenant-data"]')?.getAttribute('content');
      
      if (tenantHeader) {
        try {
          const tenantFromHeader = JSON.parse(tenantHeader);
          setTenant(tenantFromHeader);
          applyTenantTheme(tenantFromHeader);
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Failed to parse tenant from header');
        }
      }
      
      // Fallback: fazer requisição para API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/tenant/info`, {
        headers: {
          'x-tenant-domain': window.location.hostname
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Imobiliária não encontrada para este domínio');
        }
        throw new Error('Erro ao carregar dados da imobiliária');
      }
      
      const data = await response.json();
      setTenant(data.tenant);
      applyTenantTheme(data.tenant);
      
    } catch (err: any) {
      console.error('Error loading tenant:', err);
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
    
    console.log(`🎨 Applied theme for: ${tenantData.business_name}`);
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