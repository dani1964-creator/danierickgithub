require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkRLS() {
  console.log('🔐 Verificando políticas RLS para tabela brokers...\n');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Verificar se conseguimos acessar os dados
  console.log('1. Teste básico de acesso:');
  const { data: basic, error: basicError } = await supabase
    .from('brokers')
    .select('count(*)', { count: 'exact', head: true });

  if (basicError) {
    console.log('   ❌ Erro básico:', basicError.message);
  } else {
    console.log(`   ✅ Total de brokers acessíveis: ${basic}`);
  }

  // Tentar consulta com autenticação
  console.log('\n2. Verificando se precisamos estar logados:');
  const { data: session } = await supabase.auth.getSession();
  console.log(`   Sessão atual: ${session?.session?.user?.email || 'Nenhuma sessão'}`);

  // Testar consulta completa
  console.log('\n3. Consulta completa simulando SuperAdmin:');
  const { data, error, count } = await supabase
    .from('brokers')
    .select(`
      id, user_id, business_name, display_name, email, website_slug, 
      is_active, plan_type, created_at, updated_at, phone, 
      whatsapp_number, contact_email, max_properties
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    console.log('   ❌ Erro na consulta:', error.message);
    console.log('   📋 Detalhes:', JSON.stringify(error, null, 2));
  } else {
    console.log(`   ✅ Sucesso: ${count} total, ${data.length} retornados`);
    console.log('\n   📝 Brokers encontrados:');
    data.forEach((broker, i) => {
      console.log(`   ${i+1}. ${broker.business_name} (${broker.email})`);
      console.log(`      ID: ${broker.id}`);
      console.log(`      Status: ${broker.is_active ? 'Ativa' : 'Inativa'}`);
      console.log(`      Plano: ${broker.plan_type}`);
      console.log('');
    });
  }
}

checkRLS();
