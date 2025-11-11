import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import '@/index.css';
import { TenantProvider } from '@/contexts/TenantContext';

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
  }, [router.asPath]);

  return (
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
  );
}
