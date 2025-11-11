const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  envVars.SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Buscar broker
  const { data: broker } = await supabase
    .from('brokers')
    .select('id, website_slug')
    .eq('website_slug', 'danierick')
    .single();

  if (!broker) {
    console.log('❌ Broker não encontrado');
    return;
  }

  // Buscar propriedades
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, title, slug, is_active')
    .eq('broker_id', broker.id)
    .limit(5);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log('\n📊 Propriedades do broker danierick:\n');
  console.log('Total:', properties.length);
  console.log('');
  
  properties.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Slug: ${p.slug || '❌ SEM SLUG!'}`);
    console.log(`   Ativo: ${p.is_active ? '✅' : '❌'}`);
    console.log('');
  });

  // Contar slugs vazios
  const semSlug = properties.filter(p => !p.slug).length;
  if (semSlug > 0) {
    console.log(`⚠️  PROBLEMA: ${semSlug} propriedades sem slug!`);
    console.log('   Isso causa o erro "Propriedade não encontrada"');
  }
})();
