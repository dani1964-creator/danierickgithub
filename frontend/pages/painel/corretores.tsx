import dynamic from 'next/dynamic';

// Reutilizar componente Realtors existente
const RealtorsComponent = dynamic(() => import('../realtors'), { ssr: false });

/**
 * Página de Corretores do Broker
 * Acesso: painel.adminimobiliaria.site/painel/corretores
 */
export default function BrokerRealtors() {
  return <RealtorsComponent />;
}
