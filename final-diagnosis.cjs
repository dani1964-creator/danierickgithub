require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🔍 INVESTIGAÇÃO FINAL: Por que só danierick.erick@hotmail.com aparece?');
  console.log('');

  const supabaseService = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Verificar se RLS está ativo
  console.log('1️⃣ VERIFICANDO STATUS RLS DA TABELA BROKERS:');
  try {
    const { data: rlsStatus } = await supabaseService
      .rpc('check_rls_status', { table_name: 'brokers' });
    console.log('RLS Status:', rlsStatus);
  } catch (e) {
    console.log('RPC não disponível, tentando query direta...');
    
    // Query SQL direta para verificar RLS
    const { data: tableInfo, error } = await supabaseService
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'brokers')
      .eq('schemaname', 'public');
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('🔒 RLS ativo na tabela brokers:', tableInfo[0].rowsecurity);
    }
  }

  // 2. Comparar dados entre Service Role e Anon
  console.log('');
  console.log('2️⃣ COMPARAÇÃO SERVICE ROLE vs ANON KEY:');
  
  // Service Role
  const { data: serviceData, error: serviceError } = await supabaseService
    .from('brokers')
    .select('*');
  
  console.log(`📊 Service Role: ${serviceData?.length || 0} brokers`);
  if (serviceError) console.log('❌ Service Error:', serviceError.message);

  // Anon Key
  const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('brokers')
    .select('*');
  
  console.log(`📊 Anon Key: ${anonData?.length || 0} brokers`);
  if (anonError) console.log('❌ Anon Error:', anonError.message);

  // 3. Análise detalhada do broker que aparece vs os que não aparecem
  console.log('');
  console.log('3️⃣ ANÁLISE DETALHADA DOS BROKERS:');
  
  if (serviceData && serviceData.length > 0) {
    const danierick = serviceData.find(b => b.email === 'danierick.erick@hotmail.com');
    const others = serviceData.filter(b => b.email !== 'danierick.erick@hotmail.com');
    
    if (danierick) {
      console.log('🎯 BROKER QUE APARECE (danierick.erick@hotmail.com):');
      console.log('   user_id:', danierick.user_id);
      console.log('   is_active:', danierick.is_active);
      console.log('   status:', danierick.status);
      console.log('   is_super_admin:', danierick.is_super_admin);
      console.log('   created_at:', danierick.created_at);
    }
    
    if (others.length > 0) {
      console.log('');
      console.log('🚫 BROKERS QUE NÃO APARECEM:');
      others.slice(0, 2).forEach((broker, i) => {
        console.log(`   ${i+1}. ${broker.business_name} (${broker.email})`);
        console.log('      user_id:', broker.user_id);
        console.log('      is_active:', broker.is_active);
        console.log('      status:', broker.status);
        console.log('      is_super_admin:', broker.is_super_admin);
        console.log('      created_at:', broker.created_at);
        console.log('');
      });
    }
  }

  console.log('');
  console.log('🎯 RECOMENDAÇÃO:');
  
  if (serviceData && anonData && serviceData.length > anonData.length) {
    console.log('❌ RLS está bloqueando acesso anônimo!');
    console.log('💡 SOLUÇÃO: Criar política RLS que permite leitura para role anônimo:');
    console.log('   CREATE POLICY "allow_read_brokers" ON brokers FOR SELECT USING (true);');
  } else if (serviceData && serviceData.length > 1 && anonData && anonData.length === 1) {
    console.log('❌ Política RLS muito restritiva!');
    console.log('💡 SOLUÇÃO: Verificar e ajustar políticas RLS existentes.');
  } else {
    console.log('✅ Dados acessíveis - problema deve ser no client React.');
  }
})();