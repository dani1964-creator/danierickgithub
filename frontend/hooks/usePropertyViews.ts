import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface ViewResult {
  is_new_view: boolean;
  views_count: number;
  view_id?: string;
}

interface ViewStats {
  total_views: number;
  unique_views: number;
  today_views: number;
  week_views: number;
  month_views: number;
}

/**
 * Hook para gerenciar visualizações únicas de imóveis por IP
 */
export const usePropertyViews = () => {
  /**
   * Registra uma visualização única de imóvel
   * @param propertyId ID do imóvel
   * @returns Resultado da visualização (se é nova e contador atualizado)
   */
  const registerView = useCallback(async (propertyId: string): Promise<ViewResult | null> => {
    try {
      // Obter IP do usuário
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      
      // Registrar visualização via RPC
      const { data, error } = await supabase.rpc('register_property_view', {
        p_property_id: propertyId,
        p_ip_address: ip,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      });
      
      if (error) {
        logger.error('Error registering property view:', error);
        return null;
      }
      
      logger.debug('Property view registered:', data);
      return data as ViewResult;
    } catch (error) {
      logger.error('Failed to register property view:', error);
      return null;
    }
  }, []);

  /**
   * Obtém estatísticas detalhadas de visualizações de um imóvel
   * @param propertyId ID do imóvel
   * @returns Estatísticas de visualizações
   */
  const getViewStats = useCallback(async (propertyId: string): Promise<ViewStats | null> => {
    try {
      const { data, error } = await supabase.rpc('get_property_view_stats', {
        p_property_id: propertyId
      });
      
      if (error) {
        logger.error('Error getting property view stats:', error);
        return null;
      }
      
      return data as ViewStats;
    } catch (error) {
      logger.error('Failed to get property view stats:', error);
      return null;
    }
  }, []);

  return {
    registerView,
    getViewStats
  };
};
