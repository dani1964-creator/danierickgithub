#!/usr/bin/env node

/**
 * DIAGNÓSTICO: PROBLEMA PÁGINA DETALHES DO IMÓVEL
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticarPropriedades() {
  console.log('🔍 DIAGNÓSTICO: PROBLEMA PÁGINA DE DETALHES\n');
  console.log('=' .repeat(60));
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  // 1. Verificar estrutura da tabela properties
  console.log('📋 1. ESTRUTURA DA TABELA PROPERTIES...\n');
  
  try {
    const { data: propertySample } = await adminSupabase
      .from('properties')
      .select('*')
      .eq('broker_id', brokerId)
      .limit(1);

    if (propertySample && propertySample.length > 0) {
      const cols = Object.keys(propertySample[0]);
      console.log('✅ Colunas encontradas:');
      cols.forEach(col => {
        console.log(`   - ${col}: ${typeof propertySample[0][col]}`);
      });
      
      // Verificar se tem slug
      if (!cols.includes('slug')) {
        console.log('\n❌ PROBLEMA: Coluna "slug" NÃO EXISTE na tabela properties!');
        console.log('   Isso explica por que as páginas de detalhes dão 404');
      } else {
        console.log(`\n✅ Coluna "slug" existe: ${propertySample[0].slug}`);
      }
    }
  } catch (err) {
    console.log(`❌ Erro ao verificar properties: ${err.message}`);
  }

  // 2. Listar propriedades atuais
  console.log('\n🏠 2. PROPRIEDADES ATUAIS...\n');
  
  try {
    const { data: properties } = await adminSupabase
      .from('properties')
      .select('id, title, slug')
      .eq('broker_id', brokerId)
      .eq('is_active', true)
      .eq('is_published', true);

    if (properties && properties.length > 0) {
      console.log(`📊 ${properties.length} propriedades encontradas:`);
      properties.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.title}`);
        console.log(`      ID: ${prop.id}`);
        console.log(`      Slug: ${prop.slug || 'NÃO TEM SLUG!'}`);
        
        if (!prop.slug) {
          console.log(`      ❌ Esta propriedade não pode ser acessada via URL`);
        } else {
          console.log(`      🌐 URL: https://imobideps.com/${prop.slug}`);
        }
        console.log('');
      });
    }
  } catch (err) {
    console.log(`❌ Erro ao listar properties: ${err.message}`);
  }

  // 3. Testar RPC de categorias novamente
  console.log('\n⚙️ 3. TESTE RPC CATEGORIAS...\n');
  
  try {
    const { data, error } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 5
      });

    if (error) {
      console.log(`❌ RPC: ${error.message}`);
    } else {
      console.log(`✅ RPC funcionou: ${data?.length || 0} categorias`);
      
      if (data && data.length > 0) {
        data.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.category_name}: ${cat.properties_count} imóveis`);
          console.log(`      Ordem: ${cat.category_display_order || 'não definida'}`);
        });
      }
    }
  } catch (err) {
    console.log(`❌ RPC erro: ${err.message}`);
  }

  // 4. Verificar se property_categories tem display_order
  console.log('\n📂 4. VERIFICAR COLUNAS PROPERTY_CATEGORIES...\n');
  
  try {
    const { data: categorySample } = await adminSupabase
      .from('property_categories')
      .select('*')
      .eq('broker_id', brokerId)
      .limit(1);

    if (categorySample && categorySample.length > 0) {
      const cols = Object.keys(categorySample[0]);
      console.log('✅ Colunas de categorias:');
      cols.forEach(col => {
        console.log(`   - ${col}`);
      });
      
      if (!cols.includes('display_order')) {
        console.log('\n❌ Coluna "display_order" não existe! Precisa ser criada');
      }
      if (!cols.includes('color')) {
        console.log('❌ Coluna "color" não existe! Precisa ser criada');
      }
      if (!cols.includes('icon')) {
        console.log('❌ Coluna "icon" não existe! Precisa ser criada');
      }
    }
  } catch (err) {
    console.log(`❌ Erro ao verificar categorias: ${err.message}`);
  }

  console.log('\n🎯 RESUMO DOS PROBLEMAS...\n');
  console.log('1. ❌ Páginas 404: Verificar se coluna "slug" existe em properties');
  console.log('2. ⚠️ Categorias não atualizando: RPC pode estar quebrada ou cache');
  console.log('3. ⚠️ Ordem categorias: Coluna "display_order" pode estar faltando');
  console.log('4. 🔧 Próximo passo: Executar SQLs de correção');
}

diagnosticarPropriedades().catch(console.error);