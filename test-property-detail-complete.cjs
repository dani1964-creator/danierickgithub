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

async function testPropertyDetail() {
  console.log('🔍 Testando carregamento completo de detalhes de propriedade...\n');
  
  const brokerSlug = 'danierick';
  const propertySlug = 'casa-bela-vista-651438be';
  const propertyId = '651438be-46db-4347-a3b4-508820abc1a0';
  
  console.log('📋 Parâmetros:');
  console.log(`  Broker: ${brokerSlug}`);
  console.log(`  Property Slug: ${propertySlug}`);
  console.log(`  Property ID: ${propertyId}\n`);
  
  // Teste 1: RPC get_public_property_detail_with_realtor (SLUG)
  console.log('📍 Teste 1: RPC get_public_property_detail_with_realtor (com SLUG)');
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_public_property_detail_with_realtor', {
      broker_slug: brokerSlug,
      property_slug: propertySlug
    });
  
  if (rpcError) {
    console.log('  ❌ Erro RPC:', rpcError.message);
    console.log('     Detalhes:', JSON.stringify(rpcError, null, 2));
  } else if (!rpcData || rpcData.length === 0) {
    console.log('  ⚠️ RPC retornou vazio (propriedade não encontrada)');
  } else {
    console.log('  ✅ RPC funcionou!');
    console.log(`     Título: ${rpcData[0].title}`);
    console.log(`     Preço: R$ ${rpcData[0].price?.toLocaleString('pt-BR')}`);
    console.log(`     Imagem Principal: ${rpcData[0].main_image_url ? '✅' : '❌'}`);
    console.log(`     Total de Imagens: ${rpcData[0].images?.length || 0}`);
    console.log(`     Descrição: ${rpcData[0].description?.substring(0, 100)}...`);
  }
  
  // Teste 2: RPC com UUID (deve falhar após migration)
  console.log('\n📍 Teste 2: RPC get_public_property_detail_with_realtor (com UUID)');
  const { data: uuidData, error: uuidError } = await supabase
    .rpc('get_public_property_detail_with_realtor', {
      broker_slug: brokerSlug,
      property_slug: propertyId
    });
  
  if (uuidError) {
    console.log('  ❌ Erro RPC:', uuidError.message);
  } else if (!uuidData || uuidData.length === 0) {
    console.log('  ✅ UUID corretamente rejeitado (esperado após migration)');
  } else {
    console.log('  ⚠️ UUID ainda funciona (migration não aplicada?)');
  }
  
  // Teste 3: Query direta na tabela properties
  console.log('\n📍 Teste 3: Query direta na tabela properties');
  const { data: directData, error: directError } = await supabase
    .from('properties')
    .select('id, title, slug, main_image_url, images, description, price')
    .eq('slug', propertySlug)
    .single();
  
  if (directError) {
    console.log('  ❌ Erro na query:', directError.message);
  } else if (!directData) {
    console.log('  ⚠️ Propriedade não encontrada');
  } else {
    console.log('  ✅ Propriedade encontrada na tabela!');
    console.log(`     ID: ${directData.id}`);
    console.log(`     Título: ${directData.title}`);
    console.log(`     Slug: ${directData.slug}`);
    console.log(`     Imagem Principal: ${directData.main_image_url || 'NULL'}`);
    console.log(`     Array de Imagens: ${directData.images ? JSON.stringify(directData.images) : 'NULL'}`);
  }
  
  // Teste 4: Verificar broker profile
  console.log('\n📍 Teste 4: RPC get_public_broker_branding');
  const { data: brokerData, error: brokerError } = await supabase
    .rpc('get_public_broker_branding', {
      broker_website_slug: brokerSlug
    });
  
  if (brokerError) {
    console.log('  ❌ Erro RPC:', brokerError.message);
  } else if (!brokerData || brokerData.length === 0) {
    console.log('  ⚠️ Broker não encontrado');
  } else {
    console.log('  ✅ Broker encontrado!');
    console.log(`     Nome: ${brokerData[0].business_name}`);
    console.log(`     Logo: ${brokerData[0].logo_url ? '✅' : '❌'}`);
    console.log(`     Background: ${brokerData[0].background_image_url ? '✅' : '❌'}`);
    if (brokerData[0].background_image_url) {
      console.log(`     URL do Background: ${brokerData[0].background_image_url.substring(0, 100)}...`);
    }
  }
  
  // Teste 5: Verificar imagem de fundo completa
  console.log('\n📍 Teste 5: Verificar imagem de fundo completa no broker');
  const { data: fullBroker, error: fullBrokerError } = await supabase
    .from('brokers')
    .select('background_image_url')
    .eq('website_slug', brokerSlug)
    .single();
  
  if (fullBrokerError) {
    console.log('  ❌ Erro:', fullBrokerError.message);
  } else {
    console.log('  ✅ Query direta no broker:');
    console.log(`     Background URL: ${fullBroker.background_image_url || 'NULL'}`);
    
    if (fullBroker.background_image_url) {
      // Verificar se a URL está acessível
      console.log('\n  🌐 Testando acessibilidade da imagem...');
      try {
        const response = await fetch(fullBroker.background_image_url, { method: 'HEAD' });
        console.log(`     Status HTTP: ${response.status}`);
        console.log(`     Content-Type: ${response.headers.get('content-type')}`);
        if (response.status === 200) {
          console.log('     ✅ Imagem acessível!');
        } else {
          console.log('     ⚠️ Imagem pode estar com problemas');
        }
      } catch (fetchError) {
        console.log(`     ❌ Erro ao acessar imagem: ${fetchError.message}`);
      }
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMO FINAL:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`RPC property detail (slug): ${rpcData && rpcData.length > 0 ? '✅' : '❌'}`);
  console.log(`RPC property detail (uuid): ${uuidData && uuidData.length > 0 ? '⚠️ AINDA FUNCIONA' : '✅ BLOQUEADO'}`);
  console.log(`Query direta properties: ${directData ? '✅' : '❌'}`);
  console.log(`RPC broker branding: ${brokerData && brokerData.length > 0 ? '✅' : '❌'}`);
  console.log(`Background image URL: ${fullBroker?.background_image_url ? '✅' : '❌'}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (!rpcData || rpcData.length === 0) {
    console.log('⚠️ PROBLEMA IDENTIFICADO:');
    console.log('   A RPC get_public_property_detail_with_realtor NÃO está retornando dados.');
    console.log('   Possíveis causas:');
    console.log('   1. Migration slug-only não foi executada corretamente');
    console.log('   2. Parâmetros da RPC estão incorretos');
    console.log('   3. RPC está buscando por campo errado');
    console.log('\n   AÇÃO: Verificar migration no Supabase SQL Editor');
  }
}

testPropertyDetail().catch(console.error);
