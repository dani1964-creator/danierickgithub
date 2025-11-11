#!/usr/bin/env node

/**
 * Script para executar migration SQL usando Supabase SDK
 * Usa SERVICE_ROLE_KEY para ter permissões de admin
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis de ambiente do arquivo .env.local
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

// Criar cliente com privilégios de admin
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Ler arquivo SQL
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251111030000_support_uuid_in_property_detail.sql');
const sqlContent = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Executando migration SQL...');
console.log('   Projeto:', supabaseUrl);
console.log('   Arquivo:', migrationPath);
console.log('');

// Dividir SQL em comandos separados
const sqlCommands = sqlContent
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

async function executeMigration() {
  try {
    console.log('📝 Comandos SQL a executar:', sqlCommands.length);
    console.log('');

    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const cmd = sqlCommands[i];
      
      // Pular comentários e comandos vazios
      if (cmd.startsWith('--') || cmd.trim() === '') continue;
      
      console.log(`[${i + 1}/${sqlCommands.length}] Executando...`);
      
      // Usar rpc para executar SQL raw
      const { data, error } = await supabase.rpc('exec', { 
        sql: cmd + ';' 
      });
      
      if (error) {
        // Se o erro for que a função exec não existe, usar abordagem alternativa
        if (error.message.includes('exec')) {
          console.log('⚠️  Função exec não disponível, usando método alternativo...');
          console.log('');
          console.log('📋 Copie e cole este SQL no Supabase SQL Editor:');
          console.log('   https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql/new');
          console.log('');
          console.log('─'.repeat(80));
          console.log(sqlContent);
          console.log('─'.repeat(80));
          console.log('');
          return;
        }
        
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
        throw error;
      }
      
      console.log(`✅ Comando ${i + 1} executado com sucesso`);
    }
    
    console.log('');
    console.log('✅ Migration executada com sucesso!');
    console.log('');
    console.log('🎉 Agora as URLs podem usar slug ou UUID:');
    console.log('   - https://danierick.adminimobiliaria.site/apartamento-3-quartos-centro');
    console.log('   - https://danierick.adminimobiliaria.site/123e4567-e89b-12d3-a456-426614174000');
    
  } catch (error) {
    console.error('');
    console.error('❌ Erro ao executar migration:', error.message);
    console.error('');
    console.error('💡 Solução alternativa:');
    console.error('   1. Acesse: https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql/new');
    console.error('   2. Cole o conteúdo do arquivo:');
    console.error('      supabase/migrations/20251111030000_support_uuid_in_property_detail.sql');
    console.error('   3. Clique em "Run"');
    process.exit(1);
  }
}

executeMigration();
