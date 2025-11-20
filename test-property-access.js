#!/usr/bin/env node

/**
 * Script para testar acesso a imóvel via domínio personalizado
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testPropertyAccess() {
  console.log('🔍 Testando acesso a imóveis via domínio personalizado...\n');

  try {
    // 1. Buscar um broker com domínio personalizado
    console.log('1. Buscando brokers com domínios personalizados...');
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, custom_domain')
      .not('custom_domain', 'is', null)
      .not('custom_domain', 'eq', '')
      .limit(5);

    if (brokersError) {
      throw new Error(`Erro ao buscar brokers: ${brokersError.message}`);
    }

    if (!brokers || brokers.length === 0) {
      throw new Error('Nenhum broker com domínio personalizado encontrado');
    }

    console.log(`✅ Encontrados ${brokers.length} brokers com domínios personalizados:`);
    brokers.forEach(broker => {
      console.log(`  - ${broker.business_name} (${broker.website_slug}) → ${broker.custom_domain}`);
    });

    // 2. Buscar imóveis do primeiro broker
    const broker = brokers[0];
    console.log(`\n2. Buscando imóveis do broker: ${broker.business_name}`);

    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, slug, is_active, is_published')
      .eq('broker_id', broker.id)
      .eq('is_active', true)
      .eq('is_published', true)
      .limit(5);

    if (propertiesError) {
      throw new Error(`Erro ao buscar imóveis: ${propertiesError.message}`);
    }

    if (!properties || properties.length === 0) {
      throw new Error('Nenhum imóvel ativo encontrado para este broker');
    }

    console.log(`✅ Encontrados ${properties.length} imóveis ativos:`);
    properties.forEach(property => {
      console.log(`  - ${property.title} (${property.slug})`);
    });

    // 3. Testar RPC function para primeiro imóvel
    const property = properties[0];
    console.log(`\n3. Testando RPC para imóvel: ${property.title}`);

    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_public_property_detail_with_realtor', {
        broker_slug: broker.website_slug,
        property_slug: property.slug
      });

    if (rpcError) {
      throw new Error(`Erro no RPC: ${rpcError.message}`);
    }

    if (!rpcData || rpcData.length === 0) {
      throw new Error('RPC retornou dados vazios');
    }

    console.log(`✅ RPC funcionando! Dados retornados:`);
    console.log(`  - Título: ${rpcData[0].title}`);
    console.log(`  - Preço: R$ ${rpcData[0].price?.toLocaleString('pt-BR') || 'N/A'}`);
    console.log(`  - Endereço: ${rpcData[0].address}`);

    // 4. Testar RPC function para broker branding
    console.log(`\n4. Testando RPC para branding do broker...`);

    const { data: brandingData, error: brandingError } = await supabase
      .rpc('get_public_broker_branding', {
        broker_website_slug: broker.website_slug
      });

    if (brandingError) {
      throw new Error(`Erro no RPC de branding: ${brandingError.message}`);
    }

    if (!brandingData || brandingData.length === 0) {
      throw new Error('RPC de branding retornou dados vazios');
    }

    console.log(`✅ RPC de branding funcionando! Dados retornados:`);
    console.log(`  - Nome: ${brandingData[0].business_name}`);
    console.log(`  - Domínio: ${brandingData[0].custom_domain || brandingData[0].website_slug}`);

    // 5. Simular middleware de identificação por domínio personalizado
    console.log(`\n5. Testando identificação via domínio personalizado...`);

    const { data: brokerByDomain, error: domainError } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, custom_domain')
      .eq('custom_domain', broker.custom_domain)
      .single();

    if (domainError) {
      throw new Error(`Erro ao buscar por domínio: ${domainError.message}`);
    }

    console.log(`✅ Broker identificado por domínio personalizado:`);
    console.log(`  - Nome: ${brokerByDomain.business_name}`);
    console.log(`  - Slug: ${brokerByDomain.website_slug}`);
    console.log(`  - Domínio: ${brokerByDomain.custom_domain}`);

    console.log('\n🎉 Todos os testes passaram! O sistema está funcionando corretamente.');
    console.log(`\n📝 Para testar no navegador, acesse:`);
    console.log(`   https://${broker.custom_domain}/${property.slug}`);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

testPropertyAccess();