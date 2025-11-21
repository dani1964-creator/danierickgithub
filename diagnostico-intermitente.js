#!/usr/bin/env node

/**
 * DIAGNÓSTICO INCISIVO: PROBLEMA INTERMITENTE DE IMÓVEIS
 * Verificando RLS policies, cache, e consistência do banco
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnosticoIncisivo() {
  console.log('🔍 DIAGNÓSTICO INCISIVO: PROBLEMA INTERMITENTE\n');
  console.log('=' .repeat(70));

  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";
  const brokerSlug = "rfimobiliaria";

  // 1. TESTE MÚLTIPLO DO RPC PÚBLICO (simular comportamento intermitente)
  console.log('🎯 TESTE MÚLTIPLO RPC PÚBLICO (10 tentativas)...\n');
  
  const resultados = [];
  for (let i = 1; i <= 10; i++) {
    try {
      const start = Date.now();
      const { data, error } = await publicSupabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: brokerId,
          p_properties_per_category: 12
        });
      const tempo = Date.now() - start;

      if (error) {
        console.log(`❌ Tentativa ${i}: ERRO - ${error.message} (${tempo}ms)`);
        resultados.push({ tentativa: i, status: 'erro', erro: error.message, tempo });
      } else {
        const categorias = data?.length || 0;
        const totalImoveis = data?.reduce((total, cat) => {
          return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
        }, 0) || 0;
        
        console.log(`✅ Tentativa ${i}: ${categorias} categorias, ${totalImoveis} imóveis (${tempo}ms)`);
        resultados.push({ tentativa: i, status: 'sucesso', categorias, totalImoveis, tempo });
      }
    } catch (err) {
      console.log(`💥 Tentativa ${i}: EXCEÇÃO - ${err.message}`);
      resultados.push({ tentativa: i, status: 'excecao', erro: err.message });
    }
    
    // Pequena pausa entre tentativas
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Análise dos resultados
  console.log('\n📊 ANÁLISE DOS RESULTADOS:');
  const sucessos = resultados.filter(r => r.status === 'sucesso');
  const erros = resultados.filter(r => r.status === 'erro');
  const excecoes = resultados.filter(r => r.status === 'excecao');

  console.log(`✅ Sucessos: ${sucessos.length}/10 (${(sucessos.length/10*100).toFixed(1)}%)`);
  console.log(`❌ Erros: ${erros.length}/10 (${(erros.length/10*100).toFixed(1)}%)`);
  console.log(`💥 Exceções: ${excecoes.length}/10 (${(excecoes.length/10*100).toFixed(1)}%)`);

  if (sucessos.length > 0) {
    const tempoMedio = sucessos.reduce((acc, r) => acc + r.tempo, 0) / sucessos.length;
    console.log(`⏱️ Tempo médio: ${tempoMedio.toFixed(0)}ms`);
  }

  // 2. VERIFICAR RLS POLICIES DETALHADAMENTE
  console.log('\n🔐 VERIFICANDO RLS POLICIES...\n');

  const tabelas = [
    'properties',
    'property_categories', 
    'property_category_assignments',
    'brokers'
  ];

  for (const tabela of tabelas) {
    console.log(`📋 Tabela: ${tabela}`);
    
    try {
      // Verificar se RLS está habilitado
      const { data: rlsInfo, error: rlsError } = await adminSupabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', tabela)
        .single();

      // Verificar policies específicas
      const { data: policies, error: policiesError } = await adminSupabase
        .rpc('get_table_policies', { table_name: tabela })
        .catch(() => null);

      // Teste direto com anon
      const { data: testAnon, error: testAnonError } = await publicSupabase
        .from(tabela)
        .select('id')
        .limit(1);

      if (testAnonError) {
        console.log(`   ❌ Anon access: ${testAnonError.message}`);
      } else {
        console.log(`   ✅ Anon access: ${testAnon?.length || 0} registros visíveis`);
      }

    } catch (err) {
      console.log(`   💥 Erro ao verificar ${tabela}: ${err.message}`);
    }
  }

  // 3. VERIFICAR FUNÇÃO RPC ESPECÍFICA
  console.log('\n⚙️ VERIFICANDO FUNÇÃO RPC...\n');

  try {
    // Ver se a função existe e suas permissões
    const { data: funcInfo, error: funcError } = await adminSupabase
      .from('pg_proc')
      .select('*')
      .ilike('proname', '%get_homepage_categories_with_properties%');

    if (funcError) {
      console.log(`❌ Erro ao verificar função: ${funcError.message}`);
    } else if (!funcInfo || funcInfo.length === 0) {
      console.log('❌ FUNÇÃO RPC NÃO ENCONTRADA!');
    } else {
      console.log('✅ Função RPC existe');
      
      // Testar com parâmetros diferentes
      const testCases = [
        { p_broker_id: brokerId, p_properties_per_category: 12 },
        { p_broker_id: brokerId, p_properties_per_category: 5 },
        { p_broker_id: brokerId, p_properties_per_category: 20 }
      ];

      for (const testCase of testCases) {
        const { data, error } = await publicSupabase.rpc('get_homepage_categories_with_properties', testCase);
        if (error) {
          console.log(`   ❌ Teste ${JSON.stringify(testCase)}: ${error.message}`);
        } else {
          console.log(`   ✅ Teste ${JSON.stringify(testCase)}: ${data?.length || 0} categorias`);
        }
      }
    }
  } catch (err) {
    console.log(`💥 Erro ao verificar função: ${err.message}`);
  }

  // 4. VERIFICAR CONSISTÊNCIA DOS DADOS
  console.log('\n📊 VERIFICANDO CONSISTÊNCIA DOS DADOS...\n');

  try {
    // Contar registros diretamente com service role
    const queries = [
      { nome: 'Brokers ativos', query: adminSupabase.from('brokers').select('id', { count: 'exact' }).eq('is_active', true) },
      { nome: 'Properties ativas', query: adminSupabase.from('properties').select('id', { count: 'exact' }).eq('broker_id', brokerId).eq('is_active', true).eq('is_published', true) },
      { nome: 'Categorias ativas', query: adminSupabase.from('property_categories').select('id', { count: 'exact' }).eq('broker_id', brokerId).eq('is_active', true) },
      { nome: 'Associações', query: adminSupabase.from('property_category_assignments').select('id', { count: 'exact' }).eq('broker_id', brokerId) }
    ];

    const contadores = {};
    for (const { nome, query } of queries) {
      const { count, error } = await query;
      if (error) {
        console.log(`❌ ${nome}: ERRO - ${error.message}`);
      } else {
        console.log(`📊 ${nome}: ${count}`);
        contadores[nome] = count;
      }
    }

    // Verificar se há inconsistências
    if (contadores['Properties ativas'] > 0 && contadores['Categorias ativas'] > 0 && contadores['Associações'] === 0) {
      console.log('\n🚨 INCONSISTÊNCIA DETECTADA: Imóveis e categorias existem mas SEM ASSOCIAÇÕES!');
    }

  } catch (err) {
    console.log(`💥 Erro na verificação de consistência: ${err.message}`);
  }

  // 5. TESTE DE CACHE/TIMING
  console.log('\n🕐 TESTE DE CACHE/TIMING...\n');

  const temposResposta = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    const { data, error } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 12
      });
    const tempo = Date.now() - start;
    temposResposta.push(tempo);
    
    console.log(`🔄 Teste ${i+1}: ${tempo}ms - ${data?.length || 0} categorias`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const tempoMedio = temposResposta.reduce((a, b) => a + b) / temposResposta.length;
  const tempoMin = Math.min(...temposResposta);
  const tempoMax = Math.max(...temposResposta);

  console.log(`📈 Tempo médio: ${tempoMedio.toFixed(0)}ms (min: ${tempoMin}ms, max: ${tempoMax}ms)`);

  // 6. DIAGNÓSTICO FINAL
  console.log('\n🎯 DIAGNÓSTICO FINAL...\n');

  const problemasDetectados = [];
  
  if (erros.length > 0 || excecoes.length > 0) {
    problemasDetectados.push(`Falhas intermitentes: ${erros.length + excecoes.length}/10 tentativas`);
  }
  
  if (tempoMax > 5000) {
    problemasDetectados.push(`Timeouts detectados (> 5s)`);
  }

  if (problemasDetectados.length === 0) {
    console.log('✅ NENHUM PROBLEMA CRÍTICO DETECTADO');
    console.log('   O comportamento intermitente pode ser devido a:');
    console.log('   - Cache do browser');
    console.log('   - Cache do Supabase');
    console.log('   - Latência de rede');
  } else {
    console.log('🚨 PROBLEMAS DETECTADOS:');
    problemasDetectados.forEach(problema => {
      console.log(`   ❌ ${problema}`);
    });
  }
}

diagnosticoIncisivo().catch(console.error);