#!/usr/bin/env node

/**
 * Script para aplicar a migration de Payment Methods no Supabase
 * 
 * USO:
 * 1. Configure as variáveis de ambiente ou crie um arquivo .env:
 *    SUPABASE_URL=https://seu-projeto.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
 * 
 * 2. Execute: node scripts/apply-payment-methods.js
 */

const fs = require('fs');
const path = require('path');

// Carregar .env se existir
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  // dotenv não instalado, ignorar
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function applyMigration() {
  console.log('🔧 Aplicando migration de Payment Methods no Supabase...\n');

  // Verificar credenciais
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Erro: Credenciais do Supabase não configuradas!\n');
    console.log('Configure as variáveis de ambiente:');
    console.log('  SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key\n');
    console.log('Ou execute manualmente no SQL Editor do Supabase:');
    console.log('  Arquivo: supabase/sql/APLICAR_PAYMENT_METHODS_PUBLIC.sql\n');
    process.exit(1);
  }

  // Ler arquivo SQL
  const sqlFilePath = path.join(__dirname, '../supabase/sql/APLICAR_PAYMENT_METHODS_PUBLIC.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Arquivo SQL não encontrado: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`📄 Lendo arquivo: ${sqlFilePath}`);
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  // Executar SQL via fetch
  console.log('🚀 Executando SQL no Supabase...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (response.ok) {
      console.log('✅ Migration aplicada com sucesso!\n');
      console.log('🎉 Próximos passos:');
      console.log('  1. Os métodos de pagamento agora aparecerão no site público');
      console.log('  2. Edite um imóvel e adicione métodos de pagamento');
      console.log('  3. Verifique no site público do imóvel\n');
    } else {
      const error = await response.text();
      console.error(`❌ Erro ao aplicar migration (HTTP ${response.status})`);
      console.error('Resposta:', error, '\n');
      
      console.log('📝 Solução alternativa:');
      console.log('  1. Acesse o Supabase Dashboard');
      console.log('  2. Vá em SQL Editor');
      console.log('  3. Copie e cole o conteúdo de:', sqlFilePath);
      console.log('  4. Execute (Run)\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error.message, '\n');
    
    console.log('📝 Solução alternativa:');
    console.log('  1. Acesse o Supabase Dashboard');
    console.log('  2. Vá em SQL Editor');
    console.log('  3. Copie e cole o conteúdo de:', sqlFilePath);
    console.log('  4. Execute (Run)\n');
    process.exit(1);
  }
}

applyMigration();
