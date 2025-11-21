#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO: VERIFICAR SE O SQL FOI EXECUTADO
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verificarStatusCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO: STATUS DA RPC\n');
  console.log('=' .repeat(70));
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  // 1. Verificar se a função existe e sua definição
  console.log('📋 1. VERIFICANDO EXISTÊNCIA DA FUNÇÃO...\n');
  
  try {
    // Tentar query direta para verificar função
    const { data: funcCheck, error: funcError } = await adminSupabase
      .from('pg_proc')
      .select('proname, prosrc')
      .ilike('proname', '%get_homepage_categories_with_properties%')
      .limit(5);

    if (funcError) {
      console.log(`⚠️ Não foi possível verificar pg_proc: ${funcError.message}`);
    } else if (!funcCheck || funcCheck.length === 0) {
      console.log('❌ FUNÇÃO NÃO ENCONTRADA - Precisa executar o SQL!');
    } else {
      console.log(`✅ Função encontrada: ${funcCheck.length} versões`);
      funcCheck.forEach((func, index) => {
        console.log(`   ${index + 1}. ${func.proname}`);
      });
    }
  } catch (err) {
    console.log(`⚠️ Erro ao verificar função: ${err.message}`);
  }

  // 2. Testar chamada direta com dados mínimos
  console.log('\n🧪 2. TESTE DIRETO DA FUNÇÃO...\n');

  try {
    console.log('🔑 Testando com Service Role...');
    const { data: serviceData, error: serviceError } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 1
      });

    if (serviceError) {
      console.log(`❌ Service Role: ${serviceError.message}`);
      if (serviceError.message.includes('does not exist')) {
        console.log('   🚨 A FUNÇÃO NÃO EXISTE! Execute o SQL primeiro!');
      } else if (serviceError.message.includes('structure of query')) {
        console.log('   🚨 ESTRUTURA INCOMPATÍVEL! Função antiga ainda ativa!');
      }
    } else {
      console.log('✅ Service Role funcionou');
      console.log(`   Retornou: ${serviceData?.length || 0} categorias`);
      if (serviceData && serviceData.length > 0) {
        console.log('   Estrutura:', Object.keys(serviceData[0]));
      }
    }

    console.log('\n👤 Testando com Anon Role...');
    const { data: anonData, error: anonError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 1
      });

    if (anonError) {
      console.log(`❌ Anon Role: ${anonError.message}`);
    } else {
      console.log('✅ Anon Role funcionou');
      console.log(`   Retornou: ${anonData?.length || 0} categorias`);
      
      const totalImoveis = anonData?.reduce((total, cat) => {
        return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
      }, 0) || 0;
      
      console.log(`   Total imóveis: ${totalImoveis}`);

      if (totalImoveis > 0) {
        console.log('\n🎉 SUCESSO! PROBLEMA RESOLVIDO! 🎉');
      }
    }

  } catch (err) {
    console.log(`💥 Erro na chamada RPC: ${err.message}`);
  }

  // 3. Verificar dados básicos das tabelas
  console.log('\n📊 3. VERIFICANDO DADOS DAS TABELAS...\n');

  const tabelas = [
    { nome: 'properties', filtro: { broker_id: brokerId, is_active: true, is_published: true } },
    { nome: 'property_categories', filtro: { broker_id: brokerId, is_active: true } },
    { nome: 'property_category_assignments', filtro: { broker_id: brokerId } }
  ];

  for (const tabela of tabelas) {
    try {
      const { data, error, count } = await adminSupabase
        .from(tabela.nome)
        .select('*', { count: 'exact', head: true })
        .match(tabela.filtro);

      if (error) {
        console.log(`❌ ${tabela.nome}: ${error.message}`);
      } else {
        console.log(`✅ ${tabela.nome}: ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`💥 ${tabela.nome}: ${err.message}`);
    }
  }

  // 4. Diagnóstico e recomendações
  console.log('\n🎯 4. DIAGNÓSTICO E RECOMENDAÇÕES...\n');

  console.log('📋 CHECKLIST:');
  console.log('   [ ] 1. Execute o arquivo EXECUTAR-NO-DASHBOARD.sql no Supabase Dashboard');
  console.log('   [ ] 2. Vá em: Dashboard > SQL Editor');
  console.log('   [ ] 3. Cole o conteúdo completo do arquivo');
  console.log('   [ ] 4. Clique em "Run" para executar');
  console.log('   [ ] 5. Execute este teste novamente');

  console.log('\n⚠️ ATENÇÃO:');
  console.log('   - O erro "structure of query does not match" indica que:');
  console.log('     a) A função ainda não foi atualizada OU');
  console.log('     b) A função antiga ainda está em cache OU');
  console.log('     c) O SQL não foi executado completamente');

  console.log('\n💡 SE O PROBLEMA PERSISTIR:');
  console.log('   1. Verifique se executou TODO o SQL (DROP + CREATE + GRANT)');
  console.log('   2. Aguarde 30-60 segundos para o cache limpar');
  console.log('   3. Tente executar o DROP manualmente primeiro');
  console.log('   4. Depois execute o CREATE e GRANT separadamente');
}

verificarStatusCompleto().catch(console.error);