import { ReactNode, Suspense } from 'react';
import { useRouter } from 'next/router';
import { PageTransition } from '@/components/ui/page-transition';

interface PersistentLayoutProps {
  children?: ReactNode;
}

export const PersistentLayout = ({ children }: PersistentLayoutProps) => {
  const router = useRouter();
  
  // Check if we're on a dashboard route
  const isDashboardRoute = router.pathname.startsWith('/dashboard');
  
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center animate-fade-in">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      }>
        <PageTransition>
          {children}
        </PageTransition>
      </Suspense>
    </div>
  );
};