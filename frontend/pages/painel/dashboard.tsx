import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Head from 'next/head';

/**
 * Página do Dashboard do Broker
 * Acesso: painel.adminimobiliaria.site/painel/dashboard
 * O broker é identificado pela autenticação, não pelo subdomínio
 */
export default function BrokerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (!mounted) return;

        if (!session) {
          // Não está autenticado, redirecionar para login
          router.push('/auth');
        } else {
          // Está autenticado, redirecionar para dashboard principal
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Head>
          <title>Erro - Painel</title>
        </Head>
        <div className="text-center max-w-md p-6">
          <div className="mb-4 text-destructive">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar painel</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Head>
        <title>Carregando - Painel</title>
      </Head>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          {loading ? 'Verificando autenticação...' : 'Redirecionando...'}
        </p>
      </div>
    </div>
  );
}
