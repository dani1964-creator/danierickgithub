import dynamic from 'next/dynamic';

// Reutilizar componente Leads existente
const LeadsComponent = dynamic(() => import('../leads'), { ssr: false });

/**
 * Página de Leads do Broker
 * Acesso: {slug}.painel.adminimobiliaria.site/painel/leads
 */
export default function BrokerLeads() {
  return <LeadsComponent />;
}
