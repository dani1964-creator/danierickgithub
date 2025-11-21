#!/usr/bin/env node

/**
 * VERIFICAÇÃO DE TABELAS EXISTENTES
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verificarTabelas() {
  console.log('🔍 VERIFICANDO TABELAS EXISTENTES\n');
  console.log('=' .repeat(50));

  const tabelasEssenciais = [
    'brokers',
    'properties', 
    'property_categories',
    'property_category_assignments'
  ];

  console.log('📊 TESTANDO ACESSO ÀS TABELAS ESSENCIAIS...\n');

  for (const tabela of tabelasEssenciais) {
    try {
      const { data, error, count } = await adminSupabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tabela}: ERRO - ${error.message}`);
        
        if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
          console.log(`   🚨 TABELA ${tabela.toUpperCase()} NÃO EXISTE!`);
        }
      } else {
        console.log(`✅ ${tabela}: ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`💥 ${tabela}: EXCEÇÃO - ${err.message}`);
    }
  }

  console.log('\n🔍 VERIFICANDO ESTRUTURA ESPECÍFICA...\n');

  // Verificar se property_category_assignments tem a estrutura correta
  try {
    const { data: sample, error } = await adminSupabase
      .from('property_category_assignments')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ property_category_assignments: ${error.message}`);
    } else {
      console.log('✅ property_category_assignments existe');
      if (sample && sample.length > 0) {
        console.log('📋 Colunas detectadas:', Object.keys(sample[0]));
      }
    }
  } catch (err) {
    console.log(`💥 Erro ao verificar property_category_assignments: ${err.message}`);
  }

  // Verificar se a função RPC existe
  console.log('\n⚙️ VERIFICANDO FUNÇÃO RPC...\n');

  try {
    const { data, error } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: '1e7b21c7-1727-4741-8b89-dcddc406ce06',
        p_properties_per_category: 1
      });

    if (error) {
      console.log(`❌ RPC: ${error.message}`);
      
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('   🚨 FUNÇÃO RPC NÃO EXISTE!');
      }
    } else {
      console.log('✅ RPC existe e funciona');
    }
  } catch (err) {
    console.log(`💥 RPC: EXCEÇÃO - ${err.message}`);
  }

  console.log('\n📋 DIAGNÓSTICO FINAL...\n');

  // Lista de coisas que podem precisar ser criadas
  const itensPrecisamSerCriados = [];

  // Verificar novamente cada item essencial
  const verificacoes = [
    { nome: 'property_category_assignments', tipo: 'tabela' },
    { nome: 'get_homepage_categories_with_properties', tipo: 'função RPC' }
  ];

  for (const item of verificacoes) {
    if (item.tipo === 'tabela') {
      try {
        const { error } = await adminSupabase
          .from(item.nome)
          .select('id')
          .limit(1);
        
        if (error && (error.message.includes('does not exist') || error.message.includes('relation'))) {
          itensPrecisamSerCriados.push(item);
        }
      } catch (err) {
        if (err.message.includes('does not exist') || err.message.includes('relation')) {
          itensPrecisamSerCriados.push(item);
        }
      }
    } else if (item.tipo === 'função RPC') {
      try {
        const { error } = await adminSupabase.rpc(item.nome.replace('get_homepage_categories_with_properties', 'get_homepage_categories_with_properties'), {
          p_broker_id: '1e7b21c7-1727-4741-8b89-dcddc406ce06',
          p_properties_per_category: 1
        });
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          itensPrecisamSerCriados.push(item);
        }
      } catch (err) {
        if (err.message.includes('function') && err.message.includes('does not exist')) {
          itensPrecisamSerCriados.push(item);
        }
      }
    }
  }

  if (itensPrecisamSerCriados.length > 0) {
    console.log('🚨 ITENS QUE PRECISAM SER CRIADOS:');
    itensPrecisamSerCriados.forEach(item => {
      console.log(`   ❌ ${item.nome} (${item.tipo})`);
    });
  } else {
    console.log('✅ TODAS AS ESTRUTURAS ESSENCIAIS EXISTEM');
  }
}

verificarTabelas().catch(console.error);