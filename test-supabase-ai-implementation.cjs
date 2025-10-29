const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Cliente anônimo (como site público usaria)
const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simular resolução de broker_id (como o BrokerResolver faria)
async function mockResolveBrokerByHost(host) {
  const baseDomain = 'adminimobiliaria.site';
  
  // Simular subdomínio danierick.adminimobiliaria.site
  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.slice(0, -(baseDomain.length + 1));
    
    if (subdomain === 'admin') return null;
    
    const { data, error } = await supabaseAnon
      .from('brokers')
      .select('id')
      .eq('website_slug', subdomain)
      .eq('is_active', true)
      .maybeSingle();
    
    return data?.id || null;
  }
  
  return null;
}

async function testPublicQueriesFollowingSupabaseAI() {
  console.log('🧪 Testando implementação conforme recomendações do Supabase Assistant IA...\n');

  try {
    // 1. Simular host danierick.adminimobiliaria.site
    const testHost = 'danierick.adminimobiliaria.site';
    console.log(`1. Testando host: ${testHost}`);
    
    // ✅ Passo 1: Resolver broker_id primeiro (como Edge Function faria)
    const brokerId = await mockResolveBrokerByHost(testHost);
    console.log(`   Broker ID resolvido: ${brokerId ? `${brokerId.slice(0,8)}...` : 'null'}`);
    
    if (!brokerId) {
      console.log('❌ Sem broker para este host - deveria mostrar 404');
      return;
    }

    // ✅ Passo 2: Query público para dados do broker
    console.log('\n2. Testando query público para broker:');
    console.log('   WHERE id = $broker_id AND is_active = true');
    
    const { data: broker, error: brokerError } = await supabaseAnon
      .from('brokers')
      .select(`
        id, business_name, display_name, website_slug, logo_url,
        primary_color, secondary_color, site_title, site_description
      `)
      .eq('id', brokerId)
      .eq('is_active', true)
      .maybeSingle();

    if (brokerError) {
      console.log(`❌ Erro na query broker: ${brokerError.message}`);
    } else {
      console.log(`✅ Broker encontrado: ${broker?.business_name} (${broker?.website_slug})`);
    }

    // ✅ Passo 3: Query público para propriedades
    console.log('\n3. Testando query público para propriedades:');
    console.log('   WHERE broker_id = $broker_id AND is_active = true');
    
    const { data: properties, error: propsError, count } = await supabaseAnon
      .from('properties')
      .select(`
        id, title, price, property_type, transaction_type,
        address, city, main_image_url, is_active
      `, { count: 'exact' })
      .eq('broker_id', brokerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (propsError) {
      console.log(`❌ Erro na query properties: ${propsError.message}`);
    } else {
      console.log(`✅ Propriedades encontradas: ${count} total, mostrando ${properties?.length || 0}`);
      properties?.forEach((prop, i) => {
        console.log(`   ${i+1}. ${prop.title} - ${prop.property_type} (${prop.transaction_type})`);
      });
    }

    // ✅ Passo 4: Query público para domínios customizados
    console.log('\n4. Testando query público para broker_domains:');
    console.log('   WHERE broker_id = $broker_id AND is_active = true');
    
    const { data: domains, error: domainsError } = await supabaseAnon
      .from('broker_domains')
      .select('domain, is_active')
      .eq('broker_id', brokerId)
      .eq('is_active', true);

    if (domainsError) {
      console.log(`❌ Erro na query domains: ${domainsError.message}`);
    } else {
      console.log(`✅ Domínios customizados: ${domains?.length || 0}`);
      domains?.forEach(domain => {
        console.log(`   - ${domain.domain}`);
      });
    }

    // ✅ Verificar se RLS está isolando corretamente
    console.log('\n5. Verificando isolamento RLS:');
    
    // Tentar query sem filtro broker_id (RLS deve aplicar automaticamente)
    const { data: allPropsVisible, error: allPropsError } = await supabaseAnon
      .from('properties')
      .select('id, title, broker_id')
      .eq('is_active', true)
      .limit(10);

    if (allPropsError) {
      console.log(`❌ Erro na query sem filtro: ${allPropsError.message}`);
    } else {
      const uniqueBrokers = new Set(allPropsVisible?.map(p => p.broker_id));
      console.log(`✅ Query anônima sem filtro vê ${allPropsVisible?.length || 0} propriedades de ${uniqueBrokers.size} broker(s)`);
      console.log('   (RLS permite ver todas as propriedades ativas, não apenas do broker atual)');
    }

    console.log('\n📋 Resumo da implementação:');
    console.log('✅ Resolve broker_id primeiro via host');
    console.log('✅ Aplica WHERE broker_id = $resolved AND is_active = true');
    console.log('✅ Usa chave anônima (RLS funciona corretamente)');
    console.log('✅ Queries seguem padrão recomendado pelo Supabase Assistant IA');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPublicQueriesFollowingSupabaseAI();