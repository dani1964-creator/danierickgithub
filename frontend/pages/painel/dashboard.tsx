import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Importar o componente Dashboard original como client-only
const DashboardComponent = dynamic(() => import('../dashboard'), { ssr: false });

/**
 * Página do Dashboard do Broker
 * Acesso: {slug}.painel.adminimobiliaria.site/painel/dashboard
 */
export default function BrokerDashboard() {
  const router = useRouter();
  const [brokerSlug, setBrokerSlug] = useState<string>('');

  useEffect(() => {
    // Ler o slug do broker dos headers injetados pelo middleware
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';
      
      if (hostname.includes(`.painel.${baseDomain}`)) {
        const slug = hostname.split('.painel.')[0];
        setBrokerSlug(slug);
      }
    }
  }, []);

  return <DashboardComponent />;
}
