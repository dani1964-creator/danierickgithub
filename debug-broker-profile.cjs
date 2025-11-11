const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.join(__dirname, 'frontend', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugBrokerProfile() {
  console.log('🔍 Testando carregamento do broker profile (igual ao frontend)...\n');
  
  // Simular o que o frontend faz
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('website_slug', 'danierick')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('❌ Erro ao buscar broker:', error);
    return;
  }
  
  if (!data) {
    console.log('⚠️ Nenhum broker encontrado');
    return;
  }
  
  console.log('✅ Broker encontrado!\n');
  console.log('📋 Campos principais:');
  console.log(`  business_name: ${data.business_name}`);
  console.log(`  website_slug: ${data.website_slug}`);
  console.log(`  logo_url: ${data.logo_url ? '✅ configurado' : '❌ NULL'}`);
  console.log(`  background_image_url: ${data.background_image_url ? '✅ configurado' : '❌ NULL'}`);
  console.log(`  primary_color: ${data.primary_color}`);
  console.log(`  secondary_color: ${data.secondary_color}`);
  console.log(`  hero_title: ${data.hero_title || '(vazio)'}`);
  console.log(`  hero_subtitle: ${data.hero_subtitle || '(vazio)'}`);
  
  if (data.background_image_url) {
    console.log(`\n🖼️ Banner URL: ${data.background_image_url}`);
  }
  
  console.log('\n📦 Objeto completo (JSON):');
  console.log(JSON.stringify(data, null, 2));
}

debugBrokerProfile().catch(console.error);
