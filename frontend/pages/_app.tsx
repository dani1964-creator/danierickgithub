import type { AppProps } from 'next/app';
import { Toaster } from '@/components/ui/toaster';
import '@/index.css';
import { TenantProvider } from '@/contexts/TenantContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TenantProvider initialTenant={pageProps?.initialTenant}>
      <Component {...pageProps} />
      <Toaster />
    </TenantProvider>
  );
}
