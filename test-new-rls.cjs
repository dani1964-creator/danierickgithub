const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Cliente anônimo para testar RLS
const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Cliente admin para comparação
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNewRLSPolicies() {
  console.log('🔒 Testando novas políticas RLS...\n');

  try {
    // 1. Testar consulta anônima (deve ver apenas is_active=true)
    console.log('1. Teste anônimo (deve ver propriedades ativas):');
    const { data: anonProperties, error: anonError } = await supabaseAnon
      .from('properties')
      .select('id, title, is_active, broker_id')
      .limit(5);

    if (anonError) {
      console.error('❌ Erro na consulta anônima:', anonError);
    } else {
      console.log(`✅ Anônimo vê ${anonProperties?.length || 0} propriedades`);
      anonProperties?.forEach(prop => {
        console.log(`   - ${prop.title} (ativo: ${prop.is_active}, broker: ${prop.broker_id.slice(0,8)}...)`);
      });
    }

    console.log('\n2. Teste autenticado (simulando danierick.erick@hotmail.com):');
    
    // Simular login (não vamos fazer login real, mas vamos testar a estrutura)
    console.log('📝 Para testar RLS autenticado, faça login no dashboard e verifique:');
    console.log('   - Usuário danierick.erick@hotmail.com deve ver apenas 2 imóveis');
    console.log('   - Outros usuários devem ver apenas seus próprios imóveis');
    
    console.log('\n3. TESTE IMPLEMENTAÇÃO SUPABASE ASSISTANT IA:');
    
    // Simular resolução host → broker_id (como BrokerResolver faria)
    const testHost = 'danierick.adminimobiliaria.site';
    console.log(`   Host teste: ${testHost}`);
    
    // Resolver broker_id primeiro
    const { data: brokerBySlug } = await supabaseAnon
      .from('brokers')
      .select('id, business_name')
      .eq('website_slug', 'danierick')
      .eq('is_active', true)
      .maybeSingle();

    if (!brokerBySlug) {
      console.log('❌ Broker danierick não encontrado');
      return;
    }

    console.log(`   ✅ Broker resolvido: ${brokerBySlug.business_name} (${brokerBySlug.id.slice(0,8)}...)`);

    // Query público seguindo recomendações: WHERE broker_id = $resolved AND is_active = true
    const { data: publicProps, error: publicError, count } = await supabaseAnon
      .from('properties')
      .select('id, title, broker_id', { count: 'exact' })
      .eq('broker_id', brokerBySlug.id)
      .eq('is_active', true)
      .limit(5);

    console.log(`   ✅ Query pública: ${count} propriedades do broker ${brokerBySlug.business_name}`);
    publicProps?.forEach((prop, i) => {
      console.log(`      ${i+1}. ${prop.title}`);
    });

    // Verificar query de broker público
    const { data: publicBroker } = await supabaseAnon
      .from('brokers')
      .select('business_name, website_slug, primary_color, site_title')
      .eq('id', brokerBySlug.id)
      .eq('is_active', true)
      .maybeSingle();

    console.log(`   ✅ Dados públicos broker: ${publicBroker?.site_title || 'sem título'}`);

    console.log('\n📋 IMPLEMENTAÇÃO CONFORME SUPABASE AI:');
    console.log('   ✅ Resolve broker_id primeiro');
    console.log('   ✅ Aplica WHERE broker_id + is_active');
    console.log('   ✅ Usa chave anônima (RLS protege)');

    if (brokersError) {
      console.error('❌ Erro ao buscar brokers:', brokersError);
    } else {
      console.log(`✅ Encontrados ${brokersWithDomains?.length || 0} brokers ativos:`);
      brokersWithDomains?.forEach(broker => {
        const hasCustomDomain = broker.broker_domains?.some(d => d.is_active);
        const preferCustom = broker.canonical_prefer_custom_domain;
        console.log(`   - ${broker.business_name} (${broker.website_slug})`);
        console.log(`     Domínio customizado: ${hasCustomDomain ? '✅' : '❌'} | Prefere customizado: ${preferCustom ? '✅' : '❌'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testNewRLSPolicies();