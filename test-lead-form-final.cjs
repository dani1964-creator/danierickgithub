const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLeadForm() {
  try {
    console.log('🧪 TESTANDO FORMULÁRIO DE LEADS APÓS CORREÇÃO');
    
    // Buscar broker
    const { data: brokers } = await supabaseAdmin
      .from('brokers')
      .select('id, business_name')
      .limit(1);

    if (!brokers?.length) {
      console.error('❌ Nenhum broker encontrado');
      return;
    }

    const brokerId = brokers[0].id;
    console.log('✅ Usando broker:', brokers[0].business_name);

    // Testar inserção anônima
    const testLead = {
      name: 'Cliente Teste Final',
      email: 'cliente.teste.final@example.com',
      phone: '11999888777',
      message: 'Interesse em imóvel - teste final do formulário',
      broker_id: brokerId,
      source: 'website'
    };

    console.log('\n📝 Inserindo lead como usuário anônimo...');
    
    const { data, error } = await supabaseAnon
      .from('leads')
      .insert([testLead])
      .select();

    if (error) {
      console.error('❌ ERRO - Formulário ainda não funciona:', error);
      console.log('\n🔧 PRÓXIMOS PASSOS:');
      console.log('1. Aplique o SQL em: https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql');
      console.log('2. Execute novamente: node test-lead-form-final.cjs');
    } else {
      console.log('🎉 SUCESSO! Formulário funcionando!');
      console.log('📊 Lead criado:', {
        id: data[0]?.id,
        name: data[0]?.name,
        email: data[0]?.email,
        broker: brokers[0].business_name
      });
      console.log('\n✅ PROBLEMA DO FORMULÁRIO RESOLVIDO!');
    }

  } catch (err) {
    console.error('💥 Erro:', err);
  }
}

testLeadForm();
