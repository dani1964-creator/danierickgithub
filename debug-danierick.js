const fetch = require('node-fetch');

const SUPABASE_URL = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww';

async function debugDanierick() {
  try {
    console.log('🔍 Investigando broker "danierick"...\n');
    
    // 1. Listar todos os brokers
    console.log('📊 Todos os brokers no sistema:');
    const brokersResponse = await fetch(`${SUPABASE_URL}/rest/v1/brokers?select=id,business_name,website_slug,email,is_active`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    const brokers = await brokersResponse.json();
    console.log(JSON.stringify(brokers, null, 2));
    
    // 2. Procurar especificamente por "danierick"
    console.log('\n🎯 Procurando broker com slug "danierick":');
    const danierickBroker = brokers.find(b => b.website_slug === 'danierick');
    
    if (danierickBroker) {
      console.log('✅ Broker encontrado:', JSON.stringify(danierickBroker, null, 2));
      
      // 3. Testar função RPC
      console.log('\n🔧 Testando função get_broker_by_domain_or_slug:');
      const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_broker_by_domain_or_slug`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ website_slug_param: 'danierick' })
      });
      
      const rpcResult = await rpcResponse.json();
      console.log('Resultado RPC:', JSON.stringify(rpcResult, null, 2));
      
      // 4. Verificar propriedades
      console.log('\n🏠 Propriedades do broker:');
      const propsResponse = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=id,title,slug,is_active&broker_id=eq.${danierickBroker.id}&limit=5`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });
      
      const properties = await propsResponse.json();
      console.log(JSON.stringify(properties, null, 2));
      
    } else {
      console.log('❌ Broker "danierick" não encontrado!');
      console.log('\n💡 Slugs disponíveis:', brokers.map(b => b.website_slug));
    }
    
    console.log('\n🌐 URLs para teste:');
    console.log('- DigitalOcean: https://adminimobiliaria-8cx7x.ondigitalocean.app/danierick');
    console.log('- Cloudflare: https://adminimobiliaria.site/danierick');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugDanierick();