#!/usr/bin/env node

/**
 * TESTE COMPARATIVO: ANON vs SERVICE ROLE
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testeComparativo() {
  console.log('🔍 TESTE COMPARATIVO: ANON vs SERVICE ROLE\n');
  console.log('=' .repeat(60));
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  // 1. Teste RPC lado a lado
  console.log('⚙️ TESTE RPC LADO A LADO...\n');

  const parametros = {
    p_broker_id: brokerId,
    p_properties_per_category: 12
  };

  // Service Role
  console.log('🔑 SERVICE ROLE:');
  try {
    const { data: serviceData, error: serviceError } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', parametros);

    if (serviceError) {
      console.log(`❌ Erro: ${serviceError.message}`);
    } else {
      console.log(`✅ ${serviceData?.length || 0} categorias`);
      serviceData?.forEach(cat => {
        const name = cat.category_name || cat.name;
        const count = cat.properties_count || (cat.properties ? cat.properties.length : 0);
        console.log(`   ${name}: ${count} imóveis`);
        if (cat.properties && cat.properties.length > 0) {
          cat.properties.slice(0, 2).forEach(prop => {
            console.log(`     - ${prop.title || prop.property_title}`);
          });
        }
      });
    }
  } catch (err) {
    console.log(`💥 Exceção: ${err.message}`);
  }

  console.log('\n👤 ANON ROLE:');
  try {
    const { data: anonData, error: anonError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', parametros);

    if (anonError) {
      console.log(`❌ Erro: ${anonError.message}`);
    } else {
      console.log(`✅ ${anonData?.length || 0} categorias`);
      anonData?.forEach(cat => {
        const name = cat.category_name || cat.name;
        const count = cat.properties_count || (cat.properties ? cat.properties.length : 0);
        console.log(`   ${name}: ${count} imóveis`);
        if (cat.properties && cat.properties.length > 0) {
          cat.properties.slice(0, 2).forEach(prop => {
            console.log(`     - ${prop.title || prop.property_title}`);
          });
        }
      });
    }
  } catch (err) {
    console.log(`💥 Exceção: ${err.message}`);
  }

  // 2. Teste múltiplo do anon para ver se é intermitente
  console.log('\n🎯 TESTE MÚLTIPLO ANON (5 tentativas rápidas)...\n');

  for (let i = 1; i <= 5; i++) {
    try {
      const start = Date.now();
      const { data, error } = await publicSupabase
        .rpc('get_homepage_categories_with_properties', parametros);
      const tempo = Date.now() - start;

      if (error) {
        console.log(`❌ Tentativa ${i}: ERRO - ${error.message} (${tempo}ms)`);
      } else {
        const categorias = data?.length || 0;
        const totalImoveis = data?.reduce((total, cat) => {
          return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
        }, 0) || 0;
        
        console.log(`✅ Tentativa ${i}: ${categorias} categorias, ${totalImoveis} imóveis (${tempo}ms)`);
        
        // Mostrar detalhes da primeira tentativa
        if (i === 1 && data && data.length > 0) {
          data.forEach(cat => {
            const name = cat.category_name || cat.name;
            const count = cat.properties_count || (cat.properties ? cat.properties.length : 0);
            console.log(`      ${name}: ${count} imóveis`);
          });
        }
      }
    } catch (err) {
      console.log(`💥 Tentativa ${i}: EXCEÇÃO - ${err.message}`);
    }
    
    // Pausa pequena
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 3. Verificar permissões da RPC function
  console.log('\n🔐 VERIFICANDO PERMISSÕES DA FUNÇÃO RPC...\n');

  try {
    // Tentar buscar informações sobre a função (PostgreSQL system tables)
    const { data: funcInfo, error: funcError } = await adminSupabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_name', 'get_homepage_categories_with_properties')
      .eq('routine_type', 'FUNCTION');

    if (funcError) {
      console.log(`❌ Erro ao buscar info da função: ${funcError.message}`);
    } else if (!funcInfo || funcInfo.length === 0) {
      console.log('❌ Função não encontrada no schema');
    } else {
      console.log('✅ Função encontrada no schema');
      console.log(`   Security Type: ${funcInfo[0].security_type}`);
      console.log(`   SQL Data Access: ${funcInfo[0].sql_data_access}`);
    }
  } catch (err) {
    console.log(`💥 Erro ao verificar função: ${err.message}`);
  }

  // 4. Diagnóstico final
  console.log('\n🎯 ANÁLISE FINAL...\n');
  
  // Teste final comparativo direto
  const [serviceResult, anonResult] = await Promise.all([
    adminSupabase.rpc('get_homepage_categories_with_properties', parametros)
      .then(r => ({ data: r.data, error: r.error }))
      .catch(e => ({ data: null, error: e.message })),
    publicSupabase.rpc('get_homepage_categories_with_properties', parametros)
      .then(r => ({ data: r.data, error: r.error }))
      .catch(e => ({ data: null, error: e.message }))
  ]);

  const serviceCount = serviceResult.data?.reduce((total, cat) => {
    return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
  }, 0) || 0;

  const anonCount = anonResult.data?.reduce((total, cat) => {
    return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
  }, 0) || 0;

  console.log('📊 COMPARAÇÃO DIRETA:');
  console.log(`   🔑 Service Role: ${serviceCount} imóveis`);
  console.log(`   👤 Anon Role: ${anonCount} imóveis`);

  if (serviceCount > 0 && anonCount === 0) {
    console.log('\n🚨 PROBLEMA IDENTIFICADO:');
    console.log('   ❌ Service role vê os imóveis, anon role NÃO VÊ');
    console.log('   🔐 PROBLEMA DE RLS POLICY na função RPC!');
    console.log('\n💡 SOLUÇÃO: Verificar/ajustar permissões da função RPC');
  } else if (serviceCount === anonCount && anonCount > 0) {
    console.log('\n✅ AMBOS OS ROLES VÊM OS DADOS CORRETAMENTE');
    console.log('   O problema intermitente pode ser de cache ou rede');
  } else {
    console.log('\n⚠️ COMPORTAMENTO INCONSISTENTE DETECTADO');
  }
}

testeComparativo().catch(console.error);