#!/usr/bin/env node

/**
 * Script para verificar a estrutura real das tabelas no Supabase
 * e comparar com os scripts SQL criados
 */

const SUPABASE_URL = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM';

async function verificarTabela(nomeTabela) {
  console.log(`\n🔍 Verificando tabela: ${nomeTabela}`);
  
  try {
    // Verificar se a tabela existe
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${nomeTabela}?limit=0`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (response.ok) {
      console.log(`✅ Tabela ${nomeTabela} existe`);
      
      // Tentar buscar 1 registro para ver as colunas
      const responseData = await fetch(
        `${SUPABASE_URL}/rest/v1/${nomeTabela}?limit=1`,
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        }
      );
      
      const data = await responseData.json();
      if (data && data.length > 0) {
        console.log(`📋 Colunas encontradas:`, Object.keys(data[0]));
      } else {
        console.log(`📋 Tabela vazia - buscando metadados...`);
      }
    } else {
      console.log(`❌ Tabela ${nomeTabela} NÃO existe (Status: ${response.status})`);
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar ${nomeTabela}:`, error.message);
  }
}

async function verificarSchema() {
  console.log('🚀 Iniciando verificação de schema no Supabase...');
  console.log(`📍 URL: ${SUPABASE_URL}`);
  
  const tabelasParaVerificar = [
    'brokers',
    'dns_zones',
    'dns_records',
    'domain_verifications',
    'broker_domains'
  ];
  
  for (const tabela of tabelasParaVerificar) {
    await verificarTabela(tabela);
  }
  
  console.log('\n✨ Verificação concluída!\n');
  
  // Agora vamos verificar especificamente a coluna custom_domain em brokers
  console.log('🔍 Verificando coluna custom_domain em brokers...');
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/brokers?select=id,custom_domain,subdomain&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Coluna custom_domain existe em brokers');
      if (data.length > 0) {
        console.log('📋 Exemplo de dados:', data[0]);
      }
    } else {
      console.log('❌ Erro ao verificar custom_domain:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar
verificarSchema().catch(console.error);
