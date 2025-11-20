#!/usr/bin/env node

/**
 * Script para obter o DO_APP_ID do whale-app
 * 
 * Uso:
 *   DO_ACCESS_TOKEN=seu_token node scripts/get-do-app-id.js
 * 
 * Ou configure a variável de ambiente primeiro:
 *   export DO_ACCESS_TOKEN=seu_token
 *   node scripts/get-do-app-id.js
 */

const DO_ACCESS_TOKEN = process.env.DO_ACCESS_TOKEN;

if (!DO_ACCESS_TOKEN) {
  console.error('❌ Erro: DO_ACCESS_TOKEN não está configurado');
  console.error('');
  console.error('Configure com:');
  console.error('export DO_ACCESS_TOKEN=\'seu_token_aqui\'');
  console.error('');
  console.error('Ou execute:');
  console.error('DO_ACCESS_TOKEN=seu_token node scripts/get-do-app-id.js');
  process.exit(1);
}

console.log('🔍 Buscando DO_APP_ID do whale-app...');
console.log('');

async function getAppId() {
  try {
    console.log('📡 Consultando Digital Ocean API...');
    
    const response = await fetch('https://api.digitalocean.com/v2/apps', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.apps || data.apps.length === 0) {
      console.error('❌ Nenhum app encontrado na sua conta Digital Ocean');
      process.exit(1);
    }

    // Buscar whale-app
    const whaleApp = data.apps.find(app => app.spec.name === 'whale-app');

    if (!whaleApp) {
      console.error('❌ Não foi possível encontrar o whale-app');
      console.error('');
      console.error('Apps disponíveis:');
      data.apps.forEach(app => {
        console.error(`  - ${app.spec.name} (${app.id})`);
      });
      process.exit(1);
    }

    const appId = whaleApp.id;

    console.log('✅ DO_APP_ID encontrado!');
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('');
    console.log(`   ${appId}`);
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Adicione essa variável no Digital Ocean App Platform:');
    console.log('');
    console.log('1. Acesse: https://cloud.digitalocean.com/apps');
    console.log('2. Clique em \'whale-app\'');
    console.log('3. Vá em: Settings → App-Level Environment Variables');
    console.log('4. Clique em \'Edit\' e adicione:');
    console.log('');
    console.log('   Key: DO_APP_ID');
    console.log(`   Value: ${appId}`);
    console.log('   Encrypted: NO');
    console.log('   Scope: RUN_AND_BUILD_TIME');
    console.log('');
    console.log('5. Clique em \'Save\'');
    console.log('');
    console.log('✅ Após salvar, o sistema provisionará SSL automaticamente!');
    console.log('');
    console.log('🧪 Para testar imediatamente:');
    console.log('');
    console.log(`curl -X POST https://whale-app-w84mh.ondigitalocean.app/api/domains/do-add-to-app \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"domain":"imobideps.com"}'`);

  } catch (error) {
    console.error('❌ Erro ao consultar API:', error.message);
    process.exit(1);
  }
}

getAppId();
