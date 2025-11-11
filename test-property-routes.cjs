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

async function testPropertyRoutes() {
  console.log('🔍 Testando rotas de propriedades...\n');
  
  const propertyId = '651438be-46db-4347-a3b4-508820abc1a0';
  const propertySlug = 'casa-bela-vista-651438be';
  const brokerSlug = 'danierick';
  
  // Teste 1: Buscar por UUID (modo antigo - NÃO deve funcionar após migration)
  console.log('📍 Teste 1: Buscar por UUID (modo antigo)');
  const { data: uuidData, error: uuidError } = await supabase
    .rpc('get_public_property_detail_with_realtor', {
      broker_slug: brokerSlug,
      property_slug: propertyId
    });
  
  if (uuidError) {
    console.log('  ❌ Erro:', uuidError.message);
  } else if (!uuidData || uuidData.length === 0) {
    console.log('  ⚠️ Propriedade não encontrada (esperado após migration)');
  } else {
    console.log('  ✅ Propriedade encontrada (migration NÃO foi aplicada!)');
  }
  
  // Teste 2: Buscar por slug (modo novo)
  console.log('\n📍 Teste 2: Buscar por slug (modo novo)');
  const { data: slugData, error: slugError } = await supabase
    .rpc('get_public_property_detail_with_realtor', {
      broker_slug: brokerSlug,
      property_slug: propertySlug
    });
  
  if (slugError) {
    console.log('  ❌ Erro:', slugError.message);
  } else if (!slugData || slugData.length === 0) {
    console.log('  ⚠️ Propriedade não encontrada');
  } else {
    console.log('  ✅ Propriedade encontrada!');
    console.log(`     Título: ${slugData[0].title}`);
    console.log(`     ID: ${slugData[0].id}`);
    console.log(`     Slug: ${slugData[0].slug}`);
  }
  
  // Teste 3: Verificar se a migration slug-only foi executada
  console.log('\n📍 Teste 3: Verificar migration (buscar função no banco)');
  const { data: funcData, error: funcError } = await supabase
    .rpc('get_public_property_detail_with_realtor', {
      broker_slug: brokerSlug,
      property_slug: 'teste-invalido-xpto'
    });
  
  if (funcError) {
    console.log('  ⚠️ Erro na busca:', funcError.message);
  } else if (!funcData || funcData.length === 0) {
    console.log('  ✅ Função responde corretamente (slug inexistente retorna vazio)');
  }
  
  console.log('\n📊 Resumo:');
  console.log('  - UUID funciona:', uuidData && uuidData.length > 0 ? '✅ SIM (migration NÃO executada)' : '❌ NÃO (migration executada)');
  console.log('  - Slug funciona:', slugData && slugData.length > 0 ? '✅ SIM' : '❌ NÃO');
  console.log('\n⚠️ AÇÃO NECESSÁRIA:');
  
  if (uuidData && uuidData.length > 0) {
    console.log('  1. A migration 20251111040000_slug_only_property_detail.sql NÃO foi executada');
    console.log('  2. Execute a migration no Supabase SQL Editor');
    console.log('  3. Após executar, UUID não funcionará mais (apenas slug)');
  } else {
    console.log('  ✅ Migration já foi executada! Apenas slugs funcionam.');
  }
}

testPropertyRoutes().catch(console.error);
