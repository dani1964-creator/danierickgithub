import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Importar o componente Dashboard original como client-only
const DashboardComponent = dynamic(() => import('../dashboard'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Carregando painel...</p>
      </div>
    </div>
  )
});

/**
 * Página do Dashboard do Broker
 * Acesso: painel.adminimobiliaria.site/painel/dashboard
 * O broker é identificado pela autenticação, não pelo subdomínio
 */
export default function BrokerDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirecionar para auth se não estiver logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Não renderizar nada se não estiver logado (durante redirecionamento)
  if (!user) {
    return null;
  }

  // Broker será identificado pela sessão autenticada
  return <DashboardComponent />;
}
