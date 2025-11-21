#!/usr/bin/env node

/**
 * MEGA INSPEÇÃO COMPLETA DO SISTEMA
 * Verificando banco de dados, tabelas, políticas e frontend
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.kDzQVd9aVajl-qBiT7P3HzVAfYNEpXE8B6z-Yl6K7zc";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Usar anon por enquanto
const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function megaInspection() {
  console.log('🔍 MEGA INSPEÇÃO DO SISTEMA - VERIFICANDO TUDO\n');
  console.log('=' .repeat(60));

  try {
    // 1. VERIFICAR ESTRUTURA DAS TABELAS
    console.log('\n📋 1. VERIFICANDO ESTRUTURA DAS TABELAS...\n');
    
    // Verificar se as tabelas existem
    const tables = ['brokers', 'properties', 'property_categories', 'property_category_assignments'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await adminSupabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ Tabela ${table}: ERRO - ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: ${count} registros`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: FALHA - ${err.message}`);
      }
    }

    // 2. VERIFICAR DADOS DO BROKER DE TESTE
    console.log('\n👤 2. VERIFICANDO BROKER DE TESTE (rfimobiliaria)...\n');
    
    const { data: broker, error: brokerError } = await adminSupabase
      .from('brokers')
      .select('*')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    if (brokerError) {
      console.log(`❌ Broker não encontrado: ${brokerError.message}`);
      return;
    }

    console.log(`✅ Broker encontrado: ${broker.business_name}`);
    console.log(`   ID: ${broker.id}`);
    console.log(`   Slug: ${broker.website_slug}`);
    console.log(`   Domínio: ${broker.custom_domain}`);
    console.log(`   Ativo: ${broker.is_active}`);

    // 3. VERIFICAR IMÓVEIS DO BROKER
    console.log('\n🏠 3. VERIFICANDO IMÓVEIS...\n');
    
    const { data: allProperties, error: allPropsError } = await adminSupabase
      .from('properties')
      .select('*')
      .eq('broker_id', broker.id);

    if (allPropsError) {
      console.log(`❌ Erro ao buscar imóveis: ${allPropsError.message}`);
      return;
    }

    console.log(`📊 Total de imóveis: ${allProperties?.length || 0}`);
    
    if (allProperties && allProperties.length > 0) {
      console.log('\n📋 Detalhes dos imóveis:');
      allProperties.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.title}`);
        console.log(`      ID: ${prop.id}`);
        console.log(`      Slug: ${prop.slug}`);
        console.log(`      Ativo: ${prop.is_active}`);
        console.log(`      Publicado: ${prop.is_published}`);
        console.log(`      Destaque: ${prop.is_featured}`);
        console.log(`      Criado em: ${prop.created_at}`);
        console.log('');
      });

      // Filtrar apenas ativos e publicados
      const activeProperties = allProperties.filter(p => p.is_active && p.is_published);
      console.log(`✅ Imóveis ativos e publicados: ${activeProperties.length}`);
    }

    // 4. VERIFICAR CATEGORIAS
    console.log('\n🏷️ 4. VERIFICANDO CATEGORIAS...\n');
    
    const { data: categories, error: categoriesError } = await adminSupabase
      .from('property_categories')
      .select('*')
      .eq('broker_id', broker.id);

    if (categoriesError) {
      console.log(`❌ Erro ao buscar categorias: ${categoriesError.message}`);
    } else {
      console.log(`📊 Total de categorias: ${categories?.length || 0}`);
      
      if (categories && categories.length > 0) {
        console.log('\n📋 Detalhes das categorias:');
        categories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name}`);
          console.log(`      ID: ${cat.id}`);
          console.log(`      Slug: ${cat.slug}`);
          console.log(`      Ativo: ${cat.is_active}`);
          console.log(`      Homepage: ${cat.show_on_homepage}`);
          console.log(`      Ordem: ${cat.display_order}`);
          console.log('');
        });
      }
    }

    // 5. VERIFICAR ASSOCIAÇÕES
    console.log('\n🔗 5. VERIFICANDO ASSOCIAÇÕES IMÓVEL-CATEGORIA...\n');
    
    const { data: assignments, error: assignmentsError } = await adminSupabase
      .from('property_category_assignments')
      .select(`
        *,
        properties (title, slug, is_active, is_published),
        property_categories (name, is_active, show_on_homepage)
      `)
      .eq('broker_id', broker.id);

    if (assignmentsError) {
      console.log(`❌ Erro ao buscar associações: ${assignmentsError.message}`);
    } else {
      console.log(`📊 Total de associações: ${assignments?.length || 0}`);
      
      if (assignments && assignments.length > 0) {
        console.log('\n📋 Detalhes das associações:');
        assignments.forEach((assoc, index) => {
          console.log(`   ${index + 1}. Imóvel: ${assoc.properties?.title}`);
          console.log(`      Categoria: ${assoc.property_categories?.name}`);
          console.log(`      Imóvel ativo: ${assoc.properties?.is_active}`);
          console.log(`      Categoria ativa: ${assoc.property_categories?.is_active}`);
          console.log(`      Na homepage: ${assoc.property_categories?.show_on_homepage}`);
          console.log('');
        });
      } else {
        console.log('❌ PROBLEMA CRÍTICO: Nenhuma associação imóvel-categoria encontrada!');
      }
    }

    // 6. VERIFICAR RPC FUNCTIONS
    console.log('\n⚙️ 6. VERIFICANDO FUNÇÕES RPC...\n');
    
    // Testar com service role
    console.log('🔑 Testando com service role...');
    try {
      const { data: rpcData, error: rpcError } = await adminSupabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: broker.id,
          p_properties_per_category: 12
        });

      if (rpcError) {
        console.log(`❌ RPC com service role falhou: ${rpcError.message}`);
      } else {
        console.log(`✅ RPC com service role funcionou: ${rpcData?.length || 0} categorias`);
        if (rpcData && rpcData.length > 0) {
          rpcData.forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.category_name || cat.name || 'Nome indefinido'}: ${cat.properties_count || 0} imóveis`);
          });
        }
      }
    } catch (err) {
      console.log(`❌ RPC com service role: EXCEÇÃO - ${err.message}`);
    }

    // Testar com anon role
    console.log('\n👤 Testando com anon role...');
    try {
      const { data: rpcDataAnon, error: rpcErrorAnon } = await publicSupabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: broker.id,
          p_properties_per_category: 12
        });

      if (rpcErrorAnon) {
        console.log(`❌ RPC com anon role falhou: ${rpcErrorAnon.message}`);
      } else {
        console.log(`✅ RPC com anon role funcionou: ${rpcDataAnon?.length || 0} categorias`);
      }
    } catch (err) {
      console.log(`❌ RPC com anon role: EXCEÇÃO - ${err.message}`);
    }

    // 7. TESTAR CONSULTA DIRETA COMO O FRONTEND FAZ
    console.log('\n🔍 7. TESTANDO CONSULTA DIRETA (como frontend)...\n');
    
    try {
      const { data: directProperties, error: directError } = await publicSupabase
        .from('properties')
        .select('*')
        .eq('broker_id', broker.id)
        .eq('is_active', true)
        .eq('is_published', true)
        .limit(10);

      if (directError) {
        console.log(`❌ Consulta direta falhou: ${directError.message}`);
      } else {
        console.log(`✅ Consulta direta funcionou: ${directProperties?.length || 0} imóveis`);
        if (directProperties && directProperties.length > 0) {
          directProperties.forEach((prop, index) => {
            console.log(`   ${index + 1}. ${prop.title} (${prop.slug})`);
          });
        }
      }
    } catch (err) {
      console.log(`❌ Consulta direta: EXCEÇÃO - ${err.message}`);
    }

    // 8. VERIFICAR POLÍTICAS RLS
    console.log('\n🔐 8. VERIFICANDO POLÍTICAS RLS...\n');
    
    const tables_to_check = ['properties', 'property_categories', 'property_category_assignments'];
    
    for (const table of tables_to_check) {
      try {
        // Verificar se RLS está habilitado
        const { data: rlsStatus } = await adminSupabase
          .from('pg_class')
          .select('relrowsecurity')
          .eq('relname', table)
          .single();

        console.log(`📋 Tabela ${table}:`);
        console.log(`   RLS habilitado: ${rlsStatus?.relrowsecurity ? 'SIM' : 'NÃO'}`);

        // Tentar buscar políticas (isso pode falhar, mas vamos tentar)
        try {
          const { data: policies } = await adminSupabase
            .from('pg_policies')
            .select('policyname, permissive, roles, cmd')
            .eq('tablename', table);

          if (policies && policies.length > 0) {
            console.log(`   Políticas encontradas: ${policies.length}`);
            policies.forEach(policy => {
              console.log(`     - ${policy.policyname} (${policy.cmd}) para ${policy.roles}`);
            });
          } else {
            console.log(`   ⚠️ Nenhuma política encontrada`);
          }
        } catch (policyError) {
          console.log(`   ⚠️ Não foi possível verificar políticas: ${policyError.message}`);
        }
        console.log('');
      } catch (err) {
        console.log(`❌ Erro ao verificar ${table}: ${err.message}`);
      }
    }

    // 9. DIAGNÓSTICO FINAL
    console.log('\n🎯 9. DIAGNÓSTICO FINAL...\n');
    console.log('=' .repeat(60));
    
    if (!allProperties || allProperties.length === 0) {
      console.log('❌ PROBLEMA: Nenhum imóvel encontrado');
    } else if (allProperties.filter(p => p.is_active && p.is_published).length === 0) {
      console.log('❌ PROBLEMA: Imóveis existem mas nenhum está ativo E publicado');
    } else if (!categories || categories.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma categoria encontrada');
    } else if (!assignments || assignments.length === 0) {
      console.log('❌ PROBLEMA CRÍTICO: Imóveis e categorias existem, mas não há associações!');
      console.log('💡 SOLUÇÃO: Precisa criar associações imóvel-categoria');
    } else if (categories.filter(c => c.is_active && c.show_on_homepage).length === 0) {
      console.log('❌ PROBLEMA: Existem categorias mas nenhuma está ativa E visível na homepage');
    } else {
      console.log('🤔 Estrutura parece OK, pode ser problema de RPC ou frontend');
    }

    console.log('\n📋 CHECKLIST DE AÇÕES:');
    console.log('□ Verificar se imóveis estão is_active=true E is_published=true');
    console.log('□ Verificar se categorias estão is_active=true E show_on_homepage=true');
    console.log('□ Criar associações imóvel-categoria se não existirem');
    console.log('□ Verificar se RPC function existe e funciona');
    console.log('□ Verificar políticas RLS das tabelas');

  } catch (error) {
    console.error('💥 ERRO FATAL:', error.message);
  }
}

megaInspection();