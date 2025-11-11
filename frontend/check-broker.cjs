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
  const { data, error } = await supabase
    .from('brokers')
    .select('id, business_name, website_slug, custom_domain')
    .eq('id', '1e7b21c7-1727-4741-8b89-dcddc406ce06')
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log('\n📊 Broker R&F Imobiliária:');
  console.log('   Nome:', data.business_name);
  console.log('   Slug:', data.website_slug);
  console.log('   Custom Domain:', data.custom_domain || '❌ NULL (removido)');
  console.log('');
  
  if (!data.custom_domain) {
    console.log('⚠️  O custom_domain está NULL agora.');
    console.log('   URL disponível: https://' + data.website_slug + '.adminimobiliaria.site');
    console.log('');
    console.log('💡 Se tinha domínio antes, precisa restaurar no Supabase.');
  } else {
    console.log('✅ Tem domínio customizado:', data.custom_domain);
  }
})();
