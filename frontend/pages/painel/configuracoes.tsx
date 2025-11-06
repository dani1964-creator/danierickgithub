import dynamic from 'next/dynamic';

// Reutilizar componente Settings existente
const SettingsComponent = dynamic(() => import('../settings'), { ssr: false });

/**
 * Página de Configurações Gerais do Broker
 * Acesso: painel.adminimobiliaria.site/painel/configuracoes
 */
export default function BrokerSettings() {
  return <SettingsComponent />;
}
