import dynamic from 'next/dynamic';

// Reutilizar componente Properties existente
const PropertiesComponent = dynamic(() => import('../properties'), { ssr: false });

/**
 * Página de Imóveis do Broker
 * Acesso: painel.adminimobiliaria.site/painel/imoveis
 */
export default function BrokerProperties() {
  return <PropertiesComponent />;
}
