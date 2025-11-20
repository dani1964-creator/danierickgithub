/**
 * Script para verificar se as propriedades estão sendo carregadas corretamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente manualmente
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
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPropertiesLoad() {
  console.log('\n🔍 Verificando carregamento de propriedades...\n');

  // 1. Verificar brokers ativos
  const { data: brokers, error: brokersError } = await supabase
    .from('brokers')
    .select('id, business_name, website_slug, is_active')
    .eq('is_active', true);

  if (brokersError) {
    console.error('❌ Erro ao buscar brokers:', brokersError);
    return;
  }

  console.log(`✅ Brokers ativos: ${brokers.length}`);
  brokers.forEach(b => {
    console.log(`   - ${b.business_name} (slug: ${b.website_slug})`);
  });

  if (brokers.length === 0) {
    console.log('\n⚠️ Nenhum broker ativo encontrado!');
    return;
  }

  // 2. Verificar propriedades de cada broker
  for (const broker of brokers) {
    console.log(`\n📊 Propriedades do broker "${broker.business_name}":`);
    
    const { data: properties, error: propsError, count } = await supabase
      .from('properties')
      .select('id, title, is_active, is_featured, created_at', { count: 'exact' })
      .eq('broker_id', broker.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (propsError) {
      console.error('   ❌ Erro ao buscar propriedades:', propsError);
      continue;
    }

    console.log(`   Total: ${count || 0} propriedades`);
    console.log(`   Ativas: ${properties.filter(p => p.is_active).length}`);
    console.log(`   Featured: ${properties.filter(p => p.is_featured).length}`);
    
    if (properties.length > 0) {
      console.log('\n   Primeiras 5 propriedades:');
      properties.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title} (${p.is_active ? 'ativa' : 'inativa'}, ${p.is_featured ? 'destaque' : 'normal'})`);
      });
    } else {
      console.log('   ⚠️ Nenhuma propriedade encontrada!');
    }
  }

  // 3. Testar query exata do public-site
  console.log('\n\n🧪 Testando query exata do public-site.tsx:\n');
  const testBroker = brokers[0];
  
  const { data: testProps, error: testError } = await supabase
    .from('properties')
    .select('*')
    .eq('broker_id', testBroker.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(0, 49);

  if (testError) {
    console.error('❌ Erro na query de teste:', testError);
  } else {
    console.log(`✅ Query retornou ${testProps.length} propriedades ativas`);
    console.log(`   Featured: ${testProps.filter(p => p.is_featured).length}`);
    console.log(`   Regular: ${testProps.filter(p => !p.is_featured).length}`);
  }

  console.log('\n');
}

checkPropertiesLoad().catch(console.error);
