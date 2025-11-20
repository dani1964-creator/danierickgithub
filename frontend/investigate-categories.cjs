/**
 * Script para investigar categorias duplicadas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateCategoriesAndProperties() {
  console.log('\n🔍 INVESTIGANDO CATEGORIAS E IMÓVEIS\n');
  console.log('='.repeat(80));

  // 1. Listar TODAS as categorias com detalhes
  console.log('\n📦 1. TODAS AS CATEGORIAS:\n');
  
  const { data: allCategories, error: catError } = await supabase
    .from('property_categories')
    .select('*')
    .order('broker_id', { ascending: true })
    .order('display_order', { ascending: true });

  if (catError) {
    console.log('❌ Erro:', catError.message);
  } else {
    const grouped = {};
    allCategories.forEach(cat => {
      if (!grouped[cat.broker_id]) {
        grouped[cat.broker_id] = [];
      }
      grouped[cat.broker_id].push(cat);
    });

    for (const [brokerId, categories] of Object.entries(grouped)) {
      // Buscar nome do broker
      const { data: broker } = await supabase
        .from('brokers')
        .select('business_name, website_slug')
        .eq('id', brokerId)
        .single();

      console.log(`\n   🏢 Broker: ${broker?.business_name || 'Unknown'} (slug: ${broker?.website_slug || 'null'})`);
      console.log(`   📍 Broker ID: ${brokerId}`);
      console.log(`   📊 ${categories.length} categorias:\n`);

      categories.forEach((cat, i) => {
        console.log(`      ${i+1}. ${cat.name} (${cat.slug})`);
        console.log(`         - ID: ${cat.id}`);
        console.log(`         - Ordem: ${cat.display_order}`);
        console.log(`         - Ativa: ${cat.is_active}`);
        console.log(`         - Show Homepage: ${cat.show_on_homepage}`);
        console.log(`         - Color: ${cat.color || 'null'}`);
        console.log(`         - Icon: ${cat.icon || 'null'}`);
        console.log('');
      });
    }
  }

  // 2. Verificar associações property↔category
  console.log('\n\n🔗 2. ASSOCIAÇÕES PROPERTY↔CATEGORY:\n');
  
  const { data: assignments, error: assError } = await supabase
    .from('property_category_assignments')
    .select(`
      id,
      property_id,
      category_id,
      assigned_at
    `);

  if (assError) {
    console.log('❌ Erro:', assError.message);
  } else {
    console.log(`   Total: ${assignments.length} associações\n`);

    for (const ass of assignments) {
      // Buscar property
      const { data: prop } = await supabase
        .from('properties')
        .select('title, broker_id')
        .eq('id', ass.property_id)
        .single();

      // Buscar category
      const { data: cat } = await supabase
        .from('property_categories')
        .select('name, broker_id')
        .eq('id', ass.category_id)
        .single();

      console.log(`   📌 ${prop?.title || 'Unknown property'}`);
      console.log(`      → ${cat?.name || 'Unknown category'}`);
      console.log(`      Property Broker: ${prop?.broker_id}`);
      console.log(`      Category Broker: ${cat?.broker_id}`);
      console.log('');
    }
  }

  // 3. Testar RPC get_homepage_categories_with_properties
  console.log('\n\n🧪 3. TESTANDO RPC get_homepage_categories_with_properties:\n');
  
  const { data: brokers } = await supabase
    .from('brokers')
    .select('id, business_name, website_slug')
    .eq('is_active', true)
    .limit(3);

  for (const broker of brokers) {
    console.log(`\n   🏢 Broker: ${broker.business_name} (slug: ${broker.website_slug || 'null'})`);
    
    const { data: categories, error: rpcError } = await supabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: broker.id,
        p_properties_per_category: 12
      });

    if (rpcError) {
      console.log(`   ❌ Erro na RPC: ${rpcError.message}`);
    } else if (!categories || categories.length === 0) {
      console.log(`   ⚠️  RPC retornou array vazio (nenhuma categoria com imóveis)`);
    } else {
      console.log(`   ✅ RPC retornou ${categories.length} categorias:\n`);
      categories.forEach((cat, i) => {
        console.log(`      ${i+1}. ${cat.category_name} (${cat.properties?.length || 0} imóveis)`);
        if (cat.properties && cat.properties.length > 0) {
          cat.properties.forEach((prop, j) => {
            console.log(`         ${j+1}. ${prop.title}`);
          });
        }
      });
    }
  }

  // 4. Verificar qual broker o site está carregando
  console.log('\n\n🌐 4. SIMULANDO CARREGAMENTO DO SITE:\n');
  
  const testSlug = 'rfimobiliaria'; // Broker com mais imóveis
  
  console.log(`   Testando com slug: "${testSlug}"\n`);
  
  // Simular getBrokerByDomainOrSlug
  const { data: testBroker, error: brokerError } = await supabase
    .from('brokers')
    .select('*')
    .eq('website_slug', testSlug)
    .eq('is_active', true)
    .single();

  if (brokerError) {
    console.log('   ❌ Broker não encontrado:', brokerError.message);
  } else {
    console.log(`   ✅ Broker encontrado: ${testBroker.business_name}`);
    console.log(`   Broker ID: ${testBroker.id}`);
    
    // Simular getPropertiesByDomainOrSlug
    const { data: testProps, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .eq('broker_id', testBroker.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(0, 49);

    if (propsError) {
      console.log('   ❌ Erro ao buscar propriedades:', propsError.message);
    } else {
      console.log(`   ✅ Propriedades encontradas: ${testProps.length}`);
      console.log(`   Featured: ${testProps.filter(p => p.is_featured).length}`);
      console.log(`   Regular: ${testProps.filter(p => !p.is_featured).length}`);
      
      console.log('\n   Propriedades:');
      testProps.forEach((p, i) => {
        console.log(`      ${i+1}. ${p.title} (${p.is_featured ? 'DESTAQUE' : 'normal'})`);
      });
    }

    // Testar RPC para este broker
    console.log('\n   Testando RPC para este broker:\n');
    const { data: rpcResult, error: rpcErr } = await supabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: testBroker.id,
        p_properties_per_category: 12
      });

    if (rpcErr) {
      console.log('   ❌ Erro RPC:', rpcErr.message);
    } else {
      console.log(`   ✅ RPC retornou ${rpcResult?.length || 0} categorias`);
      if (rpcResult && rpcResult.length > 0) {
        rpcResult.forEach(cat => {
          console.log(`      - ${cat.category_name}: ${cat.properties?.length || 0} imóveis`);
        });
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Investigação completa!\n');
}

investigateCategoriesAndProperties().catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
