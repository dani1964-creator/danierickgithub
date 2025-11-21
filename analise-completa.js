#!/usr/bin/env node

/**
 * ANÁLISE COMPLETA DOS PROBLEMAS
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analiseCompleta() {
  console.log('🔍 ANÁLISE COMPLETA DOS PROBLEMAS\n');
  console.log('=' .repeat(70));
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";
  const problemas = [];

  // 1. TESTE DA ESTRUTURA DAS TABELAS
  console.log('📋 1. VERIFICANDO ESTRUTURA DAS TABELAS...\n');
  
  try {
    // Verificar colunas da tabela properties
    const { data: propertySample } = await adminSupabase
      .from('properties')
      .select('*')
      .limit(1);

    if (propertySample && propertySample.length > 0) {
      const cols = Object.keys(propertySample[0]);
      console.log('✅ properties - colunas:', cols.slice(0, 10).join(', ') + '...');
      
      // Verificar se tem as colunas que esperamos
      const expectedCols = ['address', 'area_m2', 'neighborhood', 'city'];
      const missingCols = expectedCols.filter(col => !cols.includes(col));
      if (missingCols.length > 0) {
        problemas.push(`Colunas faltando em properties: ${missingCols.join(', ')}`);
      }
    }
  } catch (err) {
    problemas.push(`Erro ao verificar properties: ${err.message}`);
  }

  // 2. VERIFICAR DADOS EXISTENTES
  console.log('\n📊 2. VERIFICANDO DADOS EXISTENTES...\n');
  
  const tabelas = [
    'properties',
    'property_categories', 
    'property_category_assignments'
  ];

  for (const tabela of tabelas) {
    try {
      const { count, error } = await adminSupabase
        .from(tabela)
        .select('*', { count: 'exact', head: true })
        .eq('broker_id', brokerId);

      if (error) {
        problemas.push(`Erro em ${tabela}: ${error.message}`);
      } else {
        console.log(`✅ ${tabela}: ${count || 0} registros`);
      }
    } catch (err) {
      problemas.push(`Erro ao contar ${tabela}: ${err.message}`);
    }
  }

  // 3. TESTAR A FUNÇÃO RPC ATUAL
  console.log('\n⚙️ 3. TESTANDO FUNÇÃO RPC ATUAL...\n');
  
  try {
    const { data, error } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 3
      });

    if (error) {
      console.log(`❌ RPC Service Role: ${error.message}`);
      problemas.push(`RPC quebrada: ${error.message}`);
    } else {
      console.log(`✅ RPC Service Role: ${data?.length || 0} categorias`);
    }

    // Teste com anon
    const publicSupabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww");
    
    const { data: anonData, error: anonError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 3
      });

    if (anonError) {
      console.log(`❌ RPC Anon Role: ${anonError.message}`);
      problemas.push(`RPC anon quebrada: ${anonError.message}`);
    } else {
      console.log(`✅ RPC Anon Role: ${anonData?.length || 0} categorias`);
      
      const totalImoveis = anonData?.reduce((total, cat) => {
        return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
      }, 0) || 0;
      
      console.log(`📊 Total imóveis retornados: ${totalImoveis}`);
      
      if (totalImoveis === 0) {
        problemas.push('RPC retorna categorias mas 0 imóveis');
      }
    }

  } catch (err) {
    problemas.push(`Erro crítico na RPC: ${err.message}`);
  }

  // 4. VERIFICAR ASSOCIAÇÕES ESPECÍFICAS
  console.log('\n🔗 4. VERIFICANDO ASSOCIAÇÕES DETALHADAS...\n');
  
  try {
    const { data: detailedAssoc } = await adminSupabase
      .from('property_category_assignments')
      .select(`
        *,
        properties!inner (id, title, is_active, is_published),
        property_categories!inner (id, name, is_active, show_on_homepage)
      `)
      .eq('broker_id', brokerId);

    console.log(`📊 Associações encontradas: ${detailedAssoc?.length || 0}`);
    
    if (detailedAssoc && detailedAssoc.length > 0) {
      let activeAssoc = 0;
      detailedAssoc.forEach(assoc => {
        if (assoc.properties?.is_active && 
            assoc.properties?.is_published && 
            assoc.property_categories?.is_active && 
            assoc.property_categories?.show_on_homepage) {
          activeAssoc++;
        }
      });
      console.log(`✅ Associações válidas: ${activeAssoc}`);
      
      if (activeAssoc === 0) {
        problemas.push('Associações existem mas nenhuma é válida (ativa+publicada+homepage)');
      }
    } else {
      problemas.push('Nenhuma associação encontrada');
    }

  } catch (err) {
    problemas.push(`Erro ao verificar associações: ${err.message}`);
  }

  // 5. RESUMO DE PROBLEMAS
  console.log('\n🚨 5. RESUMO DE PROBLEMAS IDENTIFICADOS...\n');
  
  if (problemas.length === 0) {
    console.log('✅ NENHUM PROBLEMA IDENTIFICADO!');
    console.log('   O problema pode estar no frontend ou cache.');
  } else {
    console.log(`❌ ${problemas.length} PROBLEMAS IDENTIFICADOS:\n`);
    problemas.forEach((problema, index) => {
      console.log(`   ${index + 1}. ${problema}`);
    });
  }

  return problemas;
}

analiseCompleta()
  .then(problemas => {
    if (problemas.length > 0) {
      console.log('\n🔧 PRÓXIMO PASSO: Gerar solução para os problemas identificados...');
    }
  })
  .catch(console.error);