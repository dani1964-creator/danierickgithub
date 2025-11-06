import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Importar o componente Dashboard original como client-only
const DashboardComponent = dynamic(() => import('../dashboard'), { ssr: false });

/**
 * Página do Dashboard do Broker
 * Acesso: painel.adminimobiliaria.site/painel/dashboard
 * O broker é identificado pela autenticação, não pelo subdomínio
 */
export default function BrokerDashboard() {
  const router = useRouter();

  // Não precisa mais extrair slug do hostname
  // O broker será identificado pela sessão autenticada
  
  return <DashboardComponent />;
}
