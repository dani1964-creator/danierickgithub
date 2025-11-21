#!/usr/bin/env node

/**
 * TESTE FINAL DA SOLUÇÃO DEFINITIVA
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testeDefinitivo() {
  console.log('🎯 TESTE DEFINITIVO DA SOLUÇÃO\n');
  console.log('=' .repeat(50));
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  // 1. Teste com Service Role
  console.log('🔑 1. TESTANDO COM SERVICE ROLE...\n');
  
  try {
    const { data: serviceData, error: serviceError } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 5
      });

    if (serviceError) {
      console.log(`❌ Service Role: ${serviceError.message}`);
    } else {
      console.log('✅ Service Role funcionou!');
      console.log(`📊 Tipo de retorno: ${typeof serviceData}`);
      
      // A nova RPC retorna JSON, então precisamos fazer parse
      let categoriesArray;
      if (typeof serviceData === 'string') {
        try {
          categoriesArray = JSON.parse(serviceData);
        } catch {
          categoriesArray = [];
        }
      } else if (Array.isArray(serviceData)) {
        categoriesArray = serviceData;
      } else {
        categoriesArray = [];
      }

      console.log(`📋 Categorias encontradas: ${categoriesArray.length}`);
      
      if (categoriesArray.length > 0) {
        categoriesArray.forEach((cat, index) => {
          const propertyCount = cat.properties_count || (cat.properties ? cat.properties.length : 0);
          console.log(`   ${index + 1}. ${cat.category_name}: ${propertyCount} imóveis`);
        });
        
        const totalImoveis = categoriesArray.reduce((total, cat) => {
          return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
        }, 0);
        console.log(`📊 Total de imóveis: ${totalImoveis}`);
      }
    }
  } catch (err) {
    console.log(`💥 Service Role: ${err.message}`);
  }

  // 2. Teste com Anon Role (mais importante)
  console.log('\n👤 2. TESTANDO COM ANON ROLE...\n');
  
  try {
    const { data: anonData, error: anonError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 5
      });

    if (anonError) {
      console.log(`❌ Anon Role: ${anonError.message}`);
      
      if (anonError.message.includes('does not exist')) {
        console.log('\n🔧 AÇÃO NECESSÁRIA:');
        console.log('   Execute o arquivo: SOLUCAO-DEFINITIVA.sql');
        console.log('   no Dashboard do Supabase!');
      }
    } else {
      console.log('✅ Anon Role funcionou!');
      console.log(`📊 Tipo de retorno: ${typeof anonData}`);
      
      // Parse do JSON retornado
      let categoriesArray;
      if (typeof anonData === 'string') {
        try {
          categoriesArray = JSON.parse(anonData);
        } catch {
          categoriesArray = [];
        }
      } else if (Array.isArray(anonData)) {
        categoriesArray = anonData;
      } else {
        categoriesArray = [];
      }

      console.log(`📋 Categorias encontradas: ${categoriesArray.length}`);
      
      if (categoriesArray.length > 0) {
        let totalImoveis = 0;
        categoriesArray.forEach((cat, index) => {
          const propertyCount = cat.properties_count || (cat.properties ? cat.properties.length : 0);
          console.log(`   ${index + 1}. ${cat.category_name}: ${propertyCount} imóveis`);
          totalImoveis += propertyCount;
          
          // Mostrar primeiro imóvel de cada categoria
          if (cat.properties && cat.properties.length > 0) {
            console.log(`      📍 ${cat.properties[0].title} - ${cat.properties[0].location}`);
          }
        });
        
        console.log(`📊 Total de imóveis: ${totalImoveis}`);
        
        if (totalImoveis > 0) {
          console.log('\n🎉 SUCESSO TOTAL! 🎉');
          console.log('✅ RPC funcionando para anon role');
          console.log('✅ Imóveis sendo retornados');
          console.log('✅ Site público deve estar funcionando');
          console.log('\n🌐 Teste o site: https://imobideps.com');
          return true;
        } else {
          console.log('\n⚠️ RPC funciona mas retorna 0 imóveis');
        }
      } else {
        console.log('\n⚠️ RPC funciona mas retorna 0 categorias');
      }
    }
  } catch (err) {
    console.log(`💥 Anon Role: ${err.message}`);
  }

  // 3. Diagnóstico se ainda há problemas
  console.log('\n📋 3. CHECKLIST FINAL...\n');
  
  console.log('✅ Verifique se executou: SOLUCAO-DEFINITIVA.sql');
  console.log('✅ Frontend atualizado para nova estrutura JSON');
  console.log('✅ CategorySelector com categorias predefinidas');
  
  return false;
}

testeDefinitivo()
  .then(sucesso => {
    if (sucesso) {
      console.log('\n🚀 IMPLEMENTAÇÃO COMPLETA!');
    } else {
      console.log('\n⚠️ Execute SOLUCAO-DEFINITIVA.sql e teste novamente');
    }
  })
  .catch(console.error);