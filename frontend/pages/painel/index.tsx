import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Página raiz do painel - Redireciona para dashboard
 * Acesso: painel.adminimobiliaria.site/painel
 */
export default function PainelIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
