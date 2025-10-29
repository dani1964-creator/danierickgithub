require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testToggle() {
  console.log('🔍 Testando problema do toggleBrokerStatus...\n');

  try {
    // 1. Buscar dados atuais
    const { data: brokers, error: fetchError } = await supabase
      .from('brokers')
      .select('id, business_name, is_active')
      .eq('email', 'danierick.erick@hotmail.com');

    if (fetchError) {
      console.log('❌ Erro ao buscar:', fetchError.message);
      return;
    }

    if (!brokers || brokers.length === 0) {
      console.log('❌ Broker não encontrado');
      return;
    }

    const broker = brokers[0];
    console.log(`📝 Broker: ${broker.business_name}`);
    console.log(`   Status atual: ${broker.is_active ? 'ATIVA' : 'INATIVA'}`);
    console.log(`   ID: ${broker.id}`);

    // 2. Testar UPDATE simples (só updated_at)
    console.log('\n🔄 Testando UPDATE simples...');
    const { error: updateError } = await supabase
      .from('brokers')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', broker.id);

    if (updateError) {
      console.log('❌ ERRO no UPDATE simples:', updateError.message);
      console.log('📋 Detalhes:', updateError);
    } else {
      console.log('✅ UPDATE simples funcionou!');
    }

    // 3. Testar UPDATE do status
    console.log('\n🔄 Testando UPDATE do status...');
    const newStatus = !broker.is_active;
    const { error: toggleError } = await supabase
      .from('brokers')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', broker.id);

    if (toggleError) {
      console.log('❌ ERRO no toggle:', toggleError.message);
      console.log('📋 Detalhes:', toggleError);
    } else {
      console.log(`✅ Toggle funcionou! Novo status: ${newStatus ? 'ATIVA' : 'INATIVA'}`);
      
      // Reverter para o estado original
      await supabase
        .from('brokers')
        .update({ is_active: broker.is_active })
        .eq('id', broker.id);
      
      console.log('🔄 Status revertido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testToggle();