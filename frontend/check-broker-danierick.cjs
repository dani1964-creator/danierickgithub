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
    .select('id, business_name, website_slug, background_image_url, logo_url, primary_color, secondary_color')
    .eq('website_slug', 'danierick')
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log('\n📊 Configuração do Broker danierick:\n');
  console.log('Nome:', data.business_name);
  console.log('Slug:', data.website_slug);
  console.log('Logo:', data.logo_url || '❌ Não configurado');
  console.log('Banner:', data.background_image_url || '❌ Não configurado (PROBLEMA!)');
  console.log('Cor Primária:', data.primary_color || '❌ Não configurado');
  console.log('Cor Secundária:', data.secondary_color || '❌ Não configurado');
  console.log('');
  
  if (!data.background_image_url) {
    console.log('⚠️  PROBLEMA IDENTIFICADO:');
    console.log('   O broker não tem banner (background_image_url) configurado!');
    console.log('   Isso faz o HeroBanner não aparecer.');
  }
})();
