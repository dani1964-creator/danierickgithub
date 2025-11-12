import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css';
import '@/theme/design-system.css';
import '@/theme/property-card.css';
import { TenantProvider } from '@/contexts/TenantContext';
import { analytics } from '@/lib/analytics';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isSaasDomain, setIsSaasDomain] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Lista exata de domínios SaaS que devem usar o favicon do SaaS
      const saasDomains = [
        'adminimobiliaria.site',
        'painel.adminimobiliaria.site',
        'www.adminimobiliaria.site',
        'localhost',
        '127.0.0.1'
      ];
      
      // Verifica se é exatamente um dos domínios SaaS (não subdomínio de corretor)
      const isSaas = saasDomains.includes(hostname);
      
      setIsSaasDomain(isSaas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Só executa uma vez ao montar o componente

  // Rastrear navegação entre páginas
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analytics.trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Rastrear tempo na página ao sair
    const handleRouteChangeStart = () => {
      analytics.trackTimeOnPage();
    };
    
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router.events]);

  return (
    <ErrorBoundary>
      <TenantProvider initialTenant={pageProps?.initialTenant}>
        {isSaasDomain && (
          <Head>
            <link rel="icon" type="image/svg+xml" href="/imobideps-logo.svg" />
            <link rel="apple-touch-icon" href="/imobideps-logo.svg" />
          </Head>
        )}
        <Component {...pageProps} />
        <Toaster />
      </TenantProvider>
    </ErrorBoundary>
  );
}
