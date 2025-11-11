#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis de ambiente
const envPath = path.join(__dirname, 'frontend', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkBroker() {
  const { data, error } = await supabase
    .from('brokers')
    .select('id, business_name, website_slug, custom_domain')
    .eq('id', '1e7b21c7-1727-4741-8b89-dcddc406ce06')
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log('📊 Broker R&F Imobiliária:');
  console.log('   ID:', data.id);
  console.log('   Nome:', data.business_name);
  console.log('   Slug:', data.website_slug);
  console.log('   Custom Domain:', data.custom_domain || 'NULL (não configurado)');
  console.log('');
  
  if (!data.custom_domain) {
    console.log('✅ Status: custom_domain está NULL');
    console.log('   Isso significa que o broker usa apenas o subdomínio:');
    console.log('   https://' + data.website_slug + '.adminimobiliaria.site');
    console.log('');
    console.log('💡 Se o broker TINHA um domínio customizado antes, você precisa restaurá-lo.');
    console.log('   Caso contrário, está tudo correto - apenas subdomínio SaaS.');
  } else {
    console.log('✅ Status: custom_domain configurado como:', data.custom_domain);
    console.log('   O broker tem domínio personalizado ativo.');
  }
}

checkBroker();
