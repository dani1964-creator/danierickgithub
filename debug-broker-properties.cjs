const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugBrokerProperties() {
  try {
    console.log('🔍 Investigando problema de isolamento de imóveis...\n');

    // 1. Encontrar usuário danierick
    console.log('1. Buscando usuário danierick.erick@hotmail.com...');
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'danierick.erick@hotmail.com');

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})\n`);

    // 2. Encontrar broker do usuário
    console.log('2. Buscando broker do usuário...');
    const { data: brokers, error: brokerError } = await supabase
      .from('brokers')
      .select('id, business_name, email, user_id')
      .eq('user_id', user.id);

    if (brokerError) {
      console.error('❌ Erro ao buscar broker:', brokerError);
      return;
    }

    if (!brokers || brokers.length === 0) {
      console.log('❌ Broker não encontrado para este usuário');
      return;
    }

    const broker = brokers[0];
    console.log(`✅ Broker encontrado: ${broker.business_name} (ID: ${broker.id})\n`);

    // 3. Contar imóveis do broker específico
    console.log('3. Contando imóveis do broker específico...');
    const { data: brokerProperties, error: brokerPropsError } = await supabase
      .from('properties')
      .select('id, title, broker_id')
      .eq('broker_id', broker.id);

    if (brokerPropsError) {
      console.error('❌ Erro ao buscar imóveis do broker:', brokerPropsError);
      return;
    }

    console.log(`✅ Imóveis do broker ${broker.business_name}: ${brokerProperties?.length || 0}\n`);

    // 4. Contar TODOS os imóveis no sistema
    console.log('4. Contando TODOS os imóveis no sistema...');
    const { data: allProperties, error: allPropsError } = await supabase
      .from('properties')
      .select('id, title, broker_id, brokers!inner(business_name)');

    if (allPropsError) {
      console.error('❌ Erro ao buscar todos os imóveis:', allPropsError);
      return;
    }

    console.log(`📊 Total de imóveis no sistema: ${allProperties?.length || 0}\n`);

    // 5. Mostrar breakdown por broker
    console.log('5. Breakdown por broker:');
    const brokerCounts = {};
    allProperties?.forEach(prop => {
      const brokerName = prop.brokers?.business_name || 'Broker desconhecido';
      brokerCounts[brokerName] = (brokerCounts[brokerName] || 0) + 1;
    });

    Object.entries(brokerCounts).forEach(([name, count]) => {
      const isCurrentBroker = name === broker.business_name;
      console.log(`${isCurrentBroker ? '👉' : '  '} ${name}: ${count} imóveis`);
    });

    console.log('\n6. Verificando políticas RLS...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd, roles, qual, with_check')
      .eq('tablename', 'properties');

    if (policyError) {
      console.error('❌ Erro ao verificar políticas RLS:', policyError);
    } else {
      console.log(`✅ Encontradas ${policies?.length || 0} políticas RLS para a tabela properties:`);
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) para roles: ${JSON.stringify(policy.roles)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugBrokerProperties();