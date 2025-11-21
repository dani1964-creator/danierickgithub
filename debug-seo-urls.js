const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

async function testarUrlSeo() {
  console.log('🔍 TESTE: URLs SEO - Debugging\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Simular contextos diferentes
  const scenarios = [
    {
      name: 'Subdomínio padrão',
      host: 'rfimobiliaria.adminimobiliaria.site',
      customDomain: undefined,
      brokerSlug: 'rfimobiliaria',
      expectedUrl: 'https://rfimobiliaria.adminimobiliaria.site/casa-de-frente-a-praia-b497fe1f'
    },
    {
      name: 'Domínio customizado (CORRETO)',
      host: 'imobideps.com',
      customDomain: 'imobideps.com',
      brokerSlug: undefined,
      expectedUrl: 'https://imobideps.com/casa-de-frente-a-praia-b497fe1f'
    },
    {
      name: 'Domínio customizado (PROBLEMA ATUAL)',
      host: 'imobideps.com/rfimobiliaria',  // Este é provavelmente o problema
      customDomain: 'imobideps.com',
      brokerSlug: 'rfimobiliaria',
      expectedUrl: 'https://imobideps.com/casa-de-frente-a-praia-b497fe1f'
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}:`);
    console.log(`   Host: ${scenario.host}`);
    console.log(`   Custom Domain: ${scenario.customDomain || 'Nenhum'}`);
    console.log(`   Broker Slug: ${scenario.brokerSlug || 'Nenhum'}`);
    
    // Lógica atual (com problema)
    const protocol = 'https';
    const baseUrl = scenario.customDomain 
      ? `${protocol}://${scenario.customDomain}`
      : `${protocol}://${scenario.host}`;
    const currentUrl = `${baseUrl}/casa-de-frente-a-praia-b497fe1f`;
    
    // Lógica corrigida
    const cleanHost = scenario.host.split('/')[0]; // Remove path do host
    const correctedBaseUrl = scenario.customDomain 
      ? `${protocol}://${scenario.customDomain}`
      : `${protocol}://${cleanHost}`;
    const correctedUrl = `${correctedBaseUrl}/casa-de-frente-a-praia-b497fe1f`;
    
    console.log(`   URL Atual: ${currentUrl}`);
    console.log(`   URL Corrigida: ${correctedUrl}`);
    console.log(`   URL Esperada: ${scenario.expectedUrl}`);
    console.log(`   ✅ Correta: ${correctedUrl === scenario.expectedUrl ? 'SIM' : 'NÃO'}`);
    console.log('');
  });

  console.log('🔧 SOLUÇÃO: Limpar o host removendo qualquer path extra');
  console.log('   const cleanHost = host.split("/")[0];');
  console.log('   const baseUrl = customDomain ? protocol://customDomain : protocol://cleanHost');
}

testarUrlSeo();