import type { AppProps } from 'next/app';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import '@/index.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <HelmetProvider>
      <Component {...pageProps} />
      <Toaster />
    </HelmetProvider>
  );
}
