require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSuperAdminQuery() {
  console.log('🔍 Testando consulta do SuperAdmin (simulando useOptimizedBrokers)...\n');

  try {
    // Simular exatamente a consulta do useOptimizedBrokers
    const { data: brokers, error: brokersError, count } = await supabase
      .from('brokers')
      .select(`id, user_id, business_name, display_name, email, website_slug, is_active, plan_type, created_at, updated_at, phone, whatsapp_number, contact_email, max_properties`, 
      { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(25);

    if (brokersError) {
      console.error('❌ Erro na consulta de brokers:', brokersError);
      return;
    }

    console.log('✅ CONSULTA REALIZADA COM SUCESSO');
    console.log(`📊 Total encontrado: ${count} brokers`);
    console.log(`📄 Retornados na página: ${brokers.length} brokers\n`);

    console.log('📝 BROKERS ENCONTRADOS:');
    brokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.business_name || 'Sem nome'}`);
      console.log(`   Email: ${broker.email}`);
      console.log(`   Status: ${broker.is_active ? '✅ Ativa' : '❌ Inativa'}`);
      console.log(`   ID: ${broker.id}`);
      console.log(`   Criado: ${new Date(broker.created_at).toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // Testar RLS policies
    console.log('🔐 TESTANDO POLÍTICAS RLS...\n');

    // Teste 1: Consulta sem autenticação (como anon)
    console.log('1. Consultando como usuário anônimo (atual):');
    const { data: anonResult, error: anonError } = await supabase
      .from('brokers')
      .select('id, business_name, email')
      .limit(5);

    if (anonError) {
      console.log('   ❌ Erro (esperado se RLS estiver ativa):', anonError.message);
    } else {
      console.log(`   ✅ Sucesso: ${anonResult.length} brokers encontrados`);
      anonResult.forEach(b => console.log(`      - ${b.business_name} (${b.email})`));
    }

    console.log('\n2. Verificando se existem políticas que permitem acesso público:');
    
    // Consulta direta sem filtros para ver se há dados
    const { data: directQuery, error: directError } = await supabase
      .from('brokers')
      .select('count(*)', { count: 'exact', head: true });

    if (directError) {
      console.log('   ❌ Erro na consulta direta:', directError.message);
    } else {
      console.log(`   ✅ Total de brokers visíveis: ${directQuery}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testSuperAdminQuery();