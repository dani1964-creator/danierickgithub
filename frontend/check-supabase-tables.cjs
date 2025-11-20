/**
 * Script para verificar estrutura completa das tabelas no Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
}

// Usar service_role_key para acesso completo
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseStructure() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA DO BANCO DE DADOS\n');
  console.log('=' .repeat(80));

  // 1. Verificar tabelas principais
  console.log('\n📋 1. TABELAS PRINCIPAIS\n');
  
  const tables = [
    'brokers',
    'properties',
    'property_categories',
    'property_category_assignments',
    'social_links',
    'subscriptions'
  ];

  for (const tableName of tables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ ${tableName.padEnd(35)} - TABELA NÃO EXISTE`);
        } else {
          console.log(`   ⚠️  ${tableName.padEnd(35)} - Erro: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${tableName.padEnd(35)} - ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`   ❌ ${tableName.padEnd(35)} - Erro: ${err.message}`);
    }
  }

  // 2. Verificar estrutura da tabela properties
  console.log('\n\n📊 2. ESTRUTURA DA TABELA "properties"\n');
  
  try {
    const { data: columns, error } = await supabase.rpc('get_table_columns', {
      table_name: 'properties'
    });

    if (error) {
      // Fallback: tentar pegar colunas via information_schema
      const { data: infoSchema, error: infoError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'properties')
        .order('ordinal_position');

      if (infoError) {
        console.log('   ⚠️ Não foi possível verificar colunas via information_schema');
        
        // Último fallback: pegar uma linha e ver suas colunas
        const { data: sample, error: sampleError } = await supabase
          .from('properties')
          .select('*')
          .limit(1)
          .single();

        if (!sampleError && sample) {
          console.log('   Colunas detectadas no sample:');
          Object.keys(sample).forEach(col => {
            console.log(`   - ${col}`);
          });
        }
      } else {
        infoSchema?.forEach(col => {
          console.log(`   - ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      }
    } else {
      console.log('   ✅ RPC function "get_table_columns" disponível');
      console.log(columns);
    }
  } catch (err) {
    console.log('   ⚠️ Erro ao verificar estrutura:', err.message);
  }

  // 3. Verificar se property_categories existe e sua estrutura
  console.log('\n\n📦 3. SISTEMA DE CATEGORIAS\n');
  
  try {
    const { data: categories, error: catError, count } = await supabase
      .from('property_categories')
      .select('*', { count: 'exact' })
      .limit(5);

    if (catError) {
      if (catError.code === '42P01') {
        console.log('   ❌ Tabela "property_categories" NÃO EXISTE');
        console.log('   ⚠️  AÇÃO NECESSÁRIA: Aplicar migration "create-property-categories-system.sql"');
      } else {
        console.log('   ⚠️  Erro ao acessar categorias:', catError.message);
      }
    } else {
      console.log(`   ✅ Tabela "property_categories" existe (${count} categorias)`);
      
      if (categories && categories.length > 0) {
        console.log('\n   Categorias cadastradas:');
        categories.forEach(cat => {
          console.log(`   - ${cat.name} (${cat.slug}) - Ordem: ${cat.display_order}, Ativa: ${cat.is_active}`);
        });
      } else {
        console.log('   ⚠️  Nenhuma categoria cadastrada ainda');
      }
    }
  } catch (err) {
    console.log('   ❌ Erro:', err.message);
  }

  try {
    const { data: assignments, error: assError, count } = await supabase
      .from('property_category_assignments')
      .select('*', { count: 'exact', head: true });

    if (assError) {
      if (assError.code === '42P01') {
        console.log('   ❌ Tabela "property_category_assignments" NÃO EXISTE');
      } else {
        console.log('   ⚠️  Erro:', assError.message);
      }
    } else {
      console.log(`   ✅ Tabela "property_category_assignments" existe (${count} associações)`);
    }
  } catch (err) {
    console.log('   ❌ Erro:', err.message);
  }

  // 4. Verificar RPC functions necessárias
  console.log('\n\n⚙️  4. RPC FUNCTIONS (Stored Procedures)\n');
  
  const rpcFunctions = [
    'get_broker_categories_with_counts',
    'get_category_properties',
    'get_homepage_categories_with_properties'
  ];

  for (const funcName of rpcFunctions) {
    try {
      // Tentar chamar com parâmetros dummy
      const testParams = funcName === 'get_broker_categories_with_counts' 
        ? { p_broker_id: '00000000-0000-0000-0000-000000000000' }
        : funcName === 'get_category_properties'
        ? { p_category_id: '00000000-0000-0000-0000-000000000000', p_limit: 1 }
        : { p_broker_id: '00000000-0000-0000-0000-000000000000', p_properties_per_category: 1 };

      const { error } = await supabase.rpc(funcName, testParams);

      if (error) {
        if (error.code === '42883') {
          console.log(`   ❌ ${funcName.padEnd(50)} - NÃO EXISTE`);
        } else {
          console.log(`   ✅ ${funcName.padEnd(50)} - Existe (erro esperado com UUID dummy)`);
        }
      } else {
        console.log(`   ✅ ${funcName.padEnd(50)} - Existe e funcionando`);
      }
    } catch (err) {
      console.log(`   ❌ ${funcName.padEnd(50)} - Erro: ${err.message}`);
    }
  }

  // 5. Verificar dados reais de brokers e properties
  console.log('\n\n🏢 5. DADOS DE BROKERS E PROPRIEDADES\n');
  
  try {
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, is_active')
      .eq('is_active', true)
      .limit(10);

    if (brokersError) {
      console.log('   ❌ Erro ao buscar brokers:', brokersError.message);
    } else {
      console.log(`   ✅ ${brokers.length} brokers ativos:\n`);
      
      for (const broker of brokers) {
        const { data: props, count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', broker.id)
          .eq('is_active', true);

        console.log(`   📍 ${broker.business_name.padEnd(30)} (slug: ${(broker.website_slug || 'null').padEnd(20)}) - ${count || 0} imóveis`);
      }
    }
  } catch (err) {
    console.log('   ❌ Erro:', err.message);
  }

  // 6. Verificar coluna is_featured vs featured
  console.log('\n\n🔍 6. VERIFICANDO COLUNA "featured" vs "is_featured"\n');
  
  try {
    // Tentar buscar com "featured"
    const { error: featuredError } = await supabase
      .from('properties')
      .select('featured')
      .limit(1);

    if (featuredError) {
      if (featuredError.code === '42703') {
        console.log('   ❌ Coluna "featured" NÃO EXISTE');
        console.log('   ✅ Sistema usa "is_featured" (correto)');
      } else {
        console.log('   ⚠️  Erro ao verificar:', featuredError.message);
      }
    } else {
      console.log('   ✅ Coluna "featured" existe');
    }

    // Tentar buscar com "is_featured"
    const { data: isFeaturedData, error: isFeaturedError } = await supabase
      .from('properties')
      .select('is_featured')
      .limit(1);

    if (isFeaturedError) {
      if (isFeaturedError.code === '42703') {
        console.log('   ❌ Coluna "is_featured" NÃO EXISTE');
      } else {
        console.log('   ⚠️  Erro:', isFeaturedError.message);
      }
    } else {
      console.log('   ✅ Coluna "is_featured" existe (correto)');
    }
  } catch (err) {
    console.log('   ❌ Erro:', err.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verificação completa!\n');
}

checkDatabaseStructure().catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
