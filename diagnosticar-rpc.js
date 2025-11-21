#!/usr/bin/env node

/**
 * DIAGNÓSTICO DA FUNÇÃO RPC ATUAL
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticarRPC() {
  console.log('🔍 DIAGNÓSTICO DA FUNÇÃO RPC ATUAL\n');
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  try {
    // Testar com service role primeiro para ver a estrutura
    console.log('🔑 TESTANDO COM SERVICE ROLE...\n');
    
    const { data: serviceData, error: serviceError } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 1
      });

    if (serviceError) {
      console.log(`❌ Service Role Erro: ${serviceError.message}`);
    } else {
      console.log('✅ Service Role funcionou');
      console.log('📊 Estrutura de retorno:');
      if (serviceData && serviceData.length > 0) {
        console.log('   Chaves:', Object.keys(serviceData[0]));
        console.log('   Primeiro item:', JSON.stringify(serviceData[0], null, 2));
      } else {
        console.log('   Dados vazios');
      }
    }

    // Agora testar com anon
    console.log('\n👤 TESTANDO COM ANON...\n');
    
    const publicSupabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww");

    const { data: anonData, error: anonError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 1
      });

    if (anonError) {
      console.log(`❌ Anon Role Erro: ${anonError.message}`);
      
      if (anonError.message.includes('structure of query does not match')) {
        console.log('\n🔧 PROBLEMA: Estrutura de retorno incompatível');
        console.log('   A função precisa ser recriada com a estrutura correta');
      }
    } else {
      console.log('✅ Anon Role funcionou');
      console.log('📊 Estrutura de retorno:');
      if (anonData && anonData.length > 0) {
        console.log('   Chaves:', Object.keys(anonData[0]));
      }
    }

    // Verificar se precisa recriar a função
    console.log('\n💡 RECOMENDAÇÃO:');
    if (serviceError || anonError) {
      console.log('   ❌ A função RPC precisa ser recriada/corrigida');
      console.log('   📋 Execute o SQL do arquivo rpc-corrigida.sql no dashboard');
    } else {
      console.log('   ✅ A função RPC está funcionando corretamente');
    }

  } catch (err) {
    console.log(`💥 Erro geral: ${err.message}`);
  }
}

diagnosticarRPC().catch(console.error);