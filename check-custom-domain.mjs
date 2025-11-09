import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando custom_domain no banco de dados...\n');

const { data: brokers, error } = await supabase
  .from('brokers')
  .select('id, user_id, website_slug, custom_domain')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Erro ao consultar:', error);
  process.exit(1);
}

console.log(`📊 Total de brokers: ${brokers.length}\n`);

brokers.forEach((broker, index) => {
  console.log(`[${index + 1}] ID: ${broker.id}`);
  console.log(`    User ID: ${broker.user_id || 'N/A'}`);
  console.log(`    Slug: ${broker.website_slug || 'NÃO CONFIGURADO'}`);
  console.log(`    Custom Domain: ${broker.custom_domain || 'NÃO CONFIGURADO'}`);
  
  if (broker.custom_domain === 'test-domain.local') {
    console.log(`    ⚠️  ENCONTRADO O PROBLEMA! Este broker tem test-domain.local`);
  }
  
  console.log('');
});

// Procurar especificamente por test-domain.local
const problematicBrokers = brokers.filter(b => b.custom_domain?.includes('test-domain'));
if (problematicBrokers.length > 0) {
  console.log('\n🚨 BROKERS COM test-domain:');
  problematicBrokers.forEach(broker => {
    console.log(`   ID: ${broker.id}`);
    console.log(`   User ID: ${broker.user_id}`);
    console.log(`   Custom Domain: ${broker.custom_domain}`);
    console.log('');
  });
} else {
  console.log('\n✅ Nenhum broker encontrado com test-domain no custom_domain');
}
