import dynamic from 'next/dynamic';

// Reutilizar componente Settings existente
const SettingsComponent = dynamic(() => import('../settings'), { ssr: false });

/**
 * Página de Configurações Gerais do Broker
 * Acesso: {slug}.painel.adminimobiliaria.site/painel/configuracoes
 */
export default function BrokerSettings() {
  return <SettingsComponent />;
}
