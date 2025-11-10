#!/usr/bin/env node
/**
 * Script para verificar se o broker "danierick" existe e está configurado corretamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkBroker() {
  console.log('🔍 Verificando broker "danierick"...\n');
  
  try {
    // 1. Verificar se existe broker com website_slug = 'danierick'
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('*')
      .eq('website_slug', 'danierick');
    
    if (brokersError) {
      console.error('❌ Erro ao buscar broker:', brokersError.message);
      return;
    }
    
    if (!brokers || brokers.length === 0) {
      console.error('❌ Nenhum broker encontrado com website_slug = "danierick"');
      console.log('\n📋 Sugestão: Verifique se o broker foi criado e se o slug está correto');
      return;
    }
    
    console.log(`✅ Broker encontrado: ${brokers.length} registro(s)\n`);
    
    brokers.forEach((broker, index) => {
      console.log(`📊 Broker #${index + 1}:`);
      console.log(`   ID: ${broker.id}`);
      console.log(`   Business Name: ${broker.business_name}`);
      console.log(`   Display Name: ${broker.display_name || 'N/A'}`);
      console.log(`   Website Slug: ${broker.website_slug}`);
      console.log(`   Is Active: ${broker.is_active ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Created At: ${broker.created_at}`);
      
      if (!broker.is_active) {
        console.log('   ⚠️  ATENÇÃO: Broker está INATIVO!');
      }
      console.log('');
    });
    
    // 2. Verificar domínios customizados
    const brokerId = brokers[0].id;
    const { data: domains, error: domainsError } = await supabase
      .from('broker_domains')
      .select('*')
      .eq('broker_id', brokerId);
    
    if (domainsError) {
      console.log('⚠️  Não foi possível verificar domínios customizados:', domainsError.message);
    } else if (domains && domains.length > 0) {
      console.log('🌐 Domínios customizados:');
      domains.forEach(domain => {
        console.log(`   - ${domain.domain} (${domain.is_active ? 'Ativo' : 'Inativo'})`);
      });
      console.log('');
    }
    
    // 3. Verificar se há propriedades cadastradas
    const { data: properties, error: propertiesError, count } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('broker_id', brokerId)
      .eq('is_active', true);
    
    if (propertiesError) {
      console.log('⚠️  Não foi possível verificar propriedades:', propertiesError.message);
    } else {
      console.log(`🏠 Propriedades ativas: ${count || 0}`);
      if (count === 0) {
        console.log('   ℹ️  Nenhuma propriedade cadastrada ainda');
      }
      console.log('');
    }
    
    // 4. Teste de acesso simulando o hostname
    console.log('🧪 Teste de resolução de hostname:');
    console.log('   Hostname simulado: danierick.adminimobiliaria.site');
    
    const hostname = 'danierick.adminimobiliaria.site';
    const baseDomain = 'adminimobiliaria.site';
    const slug = hostname.split(`.${baseDomain}`)[0];
    
    console.log(`   Slug extraído: "${slug}"`);
    
    const { data: testBroker, error: testError } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, is_active')
      .eq('website_slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    
    if (testError) {
      console.error(`   ❌ Erro no teste: ${testError.message}`);
    } else if (testBroker) {
      console.log(`   ✅ Broker resolvido com sucesso!`);
      console.log(`      ID: ${testBroker.id}`);
      console.log(`      Nome: ${testBroker.business_name}`);
    } else {
      console.error(`   ❌ Broker NÃO foi resolvido (null)`);
      console.log('   Possíveis causas:');
      console.log('   - Broker está inativo (is_active = false)');
      console.log('   - Slug não corresponde exatamente');
      console.log('   - RLS bloqueando acesso');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

checkBroker();
