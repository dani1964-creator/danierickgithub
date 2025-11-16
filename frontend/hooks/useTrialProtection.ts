import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para verificar status do trial e redirecionar se expirado
 * Páginas que devem verificar trial devem usar este hook
 */
export function useTrialProtection(options?: { 
  redirectIfExpired?: boolean;
  allowExpired?: boolean; 
}) {
  const router = useRouter();
  const [trialStatus, setTrialStatus] = useState<{
    isTrialing: boolean;
    daysRemaining: number;
    isExpired: boolean;
    loading: boolean;
  }>({
    isTrialing: false,
    daysRemaining: 0,
    isExpired: false,
    loading: true,
  });

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTrialStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = await fetch('/api/subscription/trial-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const isExpired = data.daysRemaining <= 0 && data.isTrialing;
        
        setTrialStatus({
          isTrialing: data.isTrialing || false,
          daysRemaining: data.daysRemaining || 0,
          isExpired,
          loading: false,
        });

        // Redirecionar se trial expirado e opção habilitada
        if (isExpired && options?.redirectIfExpired !== false && !options?.allowExpired) {
          // Permitir acesso apenas às páginas de upgrade e planos
          const allowedPaths = ['/upgrade', '/painel/planos', '/auth'];
          const currentPath = router.pathname;
          
          if (!allowedPaths.includes(currentPath)) {
            router.push('/upgrade');
          }
        }
      } else {
        setTrialStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
      setTrialStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return trialStatus;
}
