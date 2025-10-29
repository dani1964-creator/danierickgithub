const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function listBrokers() {
  console.log('📋 Listando brokers...');
  
  const { data, error } = await supabase
    .from('brokers')
    .select('business_name, website_slug, is_active')
    .limit(10);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  console.log('\n📊 Brokers encontrados:');
  data?.forEach((broker, i) => {
    const status = broker.is_active ? '✅ ATIVO' : '❌ INATIVO';
    const slug = broker.website_slug || '❓ SEM SLUG';
    console.log(`  ${i+1}. ${broker.business_name}`);
    console.log(`     slug: ${slug}`);
    console.log(`     status: ${status}`);
    console.log('');
  });
}

listBrokers();
