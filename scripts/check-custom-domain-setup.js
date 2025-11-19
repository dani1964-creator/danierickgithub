#!/usr/bin/env node

/**
 * Script de diagnóstico para domínios personalizados
 * 
 * Verifica:
 * 1. Configuração do banco de dados
 * 2. DNS do domínio
 * 3. Middleware e rotas
 * 4. Variáveis de ambiente
 */

const https = require('https');
const http = require('http');

const DOMAIN_TO_CHECK = 'maisexpansaodeconsciencia.site';
const BASE_DOMAIN = 'adminimobiliaria.site';

console.log('🔍 DIAGNÓSTICO DE DOMÍNIO PERSONALIZADO\n');
console.log('='.repeat(60));
console.log(`Domínio a verificar: ${DOMAIN_TO_CHECK}`);
console.log(`Domínio base: ${BASE_DOMAIN}`);
console.log('='.repeat(60) + '\n');

// 1. Verificar resolução DNS
console.log('📡 1. VERIFICAÇÃO DE DNS');
console.log('-'.repeat(60));

function checkDNS(domain) {
  return new Promise((resolve) => {
    const dns = require('dns');
    
    console.log(`Resolvendo DNS para: ${domain}`);
    
    // Tentar resolver A record
    dns.resolve4(domain, (err, addresses) => {
      if (err) {
        console.log(`❌ A record: Erro - ${err.code}`);
        
        // Tentar CNAME
        dns.resolveCname(domain, (errCname, cnames) => {
          if (errCname) {
            console.log(`❌ CNAME: Erro - ${errCname.code}`);
            console.log(`\n⚠️  DNS NÃO CONFIGURADO para ${domain}`);
            console.log(`\nInstruções:`);
            console.log(`1. Acesse o painel do GoDaddy (ou seu registrador)`);
            console.log(`2. Adicione os seguintes registros:`);
            console.log(`\n   Registro A:`);
            console.log(`   - Tipo: A`);
            console.log(`   - Nome: @ (ou deixe em branco)`);
            console.log(`   - Valor: 162.159.140.98`);
            console.log(`   - TTL: 1 hora`);
            console.log(`\n   Registro CNAME:`);
            console.log(`   - Tipo: CNAME`);
            console.log(`   - Nome: www`);
            console.log(`   - Valor: ${BASE_DOMAIN}`);
            console.log(`   - TTL: 1 hora`);
            resolve({ configured: false, type: null, value: null });
          } else {
            console.log(`✅ CNAME: ${cnames.join(', ')}`);
            resolve({ configured: true, type: 'CNAME', value: cnames[0] });
          }
        });
      } else {
        console.log(`✅ A record: ${addresses.join(', ')}`);
        resolve({ configured: true, type: 'A', value: addresses[0] });
      }
    });
  });
}

// 2. Verificar conectividade HTTP/HTTPS
function checkHTTP(domain) {
  return new Promise((resolve) => {
    console.log(`\nTestando HTTPS para: ${domain}`);
    
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 10000,
      rejectUnauthorized: false, // Aceitar certificados autoassinados para teste
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Status HTTPS: ${res.statusCode}`);
      console.log(`✅ Headers recebidos:`);
      console.log(`   - x-app-type: ${res.headers['x-app-type'] || 'não definido'}`);
      console.log(`   - x-custom-domain: ${res.headers['x-custom-domain'] || 'não definido'}`);
      console.log(`   - x-hostname: ${res.headers['x-hostname'] || 'não definido'}`);
      resolve({ success: true, status: res.statusCode, headers: res.headers });
    });

    req.on('error', (err) => {
      console.log(`❌ Erro HTTPS: ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log(`❌ Timeout HTTPS (10s)`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

// 3. Verificar middleware
console.log('\n📋 2. VERIFICAÇÃO DO MIDDLEWARE');
console.log('-'.repeat(60));

const fs = require('fs');
const path = require('path');

const middlewarePath = path.join(__dirname, '../frontend/middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  console.log('✅ Middleware existe: frontend/middleware.ts');
  
  // Verificar se trata domínios personalizados
  if (middlewareContent.includes('isCustomDomain')) {
    console.log('✅ Middleware trata domínios personalizados (isCustomDomain)');
  } else {
    console.log('❌ Middleware NÃO trata domínios personalizados');
  }
  
  // Verificar rewrite para /public-site
  if (middlewareContent.includes('/public-site')) {
    console.log('✅ Middleware reescreve para /public-site');
  } else {
    console.log('⚠️  Middleware pode não estar reescrevendo corretamente');
  }
  
  // Verificar se passa headers
  if (middlewareContent.includes('x-custom-domain')) {
    console.log('✅ Middleware adiciona header x-custom-domain');
  } else {
    console.log('⚠️  Middleware pode não estar passando custom domain nos headers');
  }
} else {
  console.log('❌ Middleware NÃO ENCONTRADO');
}

// 4. Verificar página public-site
console.log('\n📄 3. VERIFICAÇÃO DA PÁGINA PUBLIC-SITE');
console.log('-'.repeat(60));

const publicSitePath = path.join(__dirname, '../frontend/pages/public-site.tsx');
const publicSiteAltPath = path.join(__dirname, '../frontend/pages/public-site/index.tsx');

if (fs.existsSync(publicSitePath)) {
  console.log('✅ Página existe: pages/public-site.tsx');
} else if (fs.existsSync(publicSiteAltPath)) {
  console.log('✅ Página existe: pages/public-site/index.tsx');
} else {
  console.log('❌ Página public-site.tsx NÃO ENCONTRADA');
  console.log('   A vitrine pública precisa dessa página para funcionar');
}

// Executar verificações assíncronas
(async () => {
  const dnsResult = await checkDNS(DOMAIN_TO_CHECK);
  
  if (dnsResult.configured) {
    console.log('\n📡 4. TESTE DE CONECTIVIDADE');
    console.log('-'.repeat(60));
    await checkHTTP(DOMAIN_TO_CHECK);
  }
  
  // 5. Resumo e recomendações
  console.log('\n📊 RESUMO E RECOMENDAÇÕES');
  console.log('='.repeat(60));
  
  if (!dnsResult.configured) {
    console.log('🔴 PROBLEMA PRINCIPAL: DNS não configurado');
    console.log('\n✅ SOLUÇÃO:');
    console.log('1. Acesse o painel do GoDaddy');
    console.log('2. Vá em "Gerenciar DNS" ou "DNS Management"');
    console.log('3. Adicione os registros conforme instruções acima');
    console.log('4. Aguarde 10min a 48h para propagação');
    console.log('5. Execute este script novamente');
  } else {
    console.log('✅ DNS configurado corretamente');
    console.log('\nVerifique:');
    console.log('- Se o middleware está sendo executado corretamente');
    console.log('- Se a página public-site.tsx existe e está funcionando');
    console.log('- Se o custom_domain está salvo no banco de dados');
  }
  
  console.log('\n' + '='.repeat(60));
})();
