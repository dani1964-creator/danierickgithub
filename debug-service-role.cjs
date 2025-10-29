require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🕵️ INVESTIGAÇÃO DETALHADA: Por que Service Role só retorna 1 broker?');
  console.log('');

  // 1. Teste com Service Role (deveria bypass tudo)
  const supabaseService = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('1️⃣ QUERY COM SERVICE ROLE (mesma do React):');
  const { data: serviceData, error: serviceError } = await supabaseService
    .from('brokers')
    .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
    .order('created_at', { ascending: false });

  console.log('📊 Service Role Result:', {
    count: serviceData?.length || 0,
    error: serviceError?.message || 'sem erro'
  });

  if (serviceData) {
    console.log('📋 Broker(s) retornado(s) pelo Service Role:');
    serviceData.forEach((b, i) => {
      console.log(`   ${i+1}. ${b.business_name} (${b.email})`);
    });
  }

  console.log('');

  // 2. Teste com query mais ampla
  console.log('2️⃣ QUERY MAIS AMPLA (todos os campos):');
  const { data: allData, error: allError } = await supabaseService
    .from('brokers')
    .select('*');

  console.log('📊 Query Ampla Result:', {
    count: allData?.length || 0,
    error: allError?.message || 'sem erro'
  });

  console.log('');

  // 3. Verificar se RLS está ativo na tabela
  console.log('3️⃣ VERIFICANDO SE RLS ESTÁ ATIVO:');
  const { data: tableInfo, error: tableError } = await supabaseService
    .from('information_schema.tables')
    .select('table_name, row_security')
    .eq('table_name', 'brokers')
    .eq('table_schema', 'public');

  if (tableInfo && tableInfo.length > 0) {
    console.log('🔒 RLS Status:', tableInfo[0].row_security ? 'ATIVO' : 'INATIVO');
  }

  console.log('');

  // 4. Query direta no banco (sem RLS)
  console.log('4️⃣ QUERY DIRETA (bypassing Supabase client):');
  try {
    const { data: directData, error: directError } = await supabaseService
      .rpc('direct_broker_count');
    
    console.log('Direct query result:', directData, directError?.message);
  } catch (e) {
    console.log('RPC não disponível, testando query raw...');
  }

  console.log('');

  // 5. Teste sem ORDER BY
  console.log('5️⃣ TESTE SEM ORDER BY:');
  const { data: noOrderData, error: noOrderError } = await supabaseService
    .from('brokers')
    .select('id, business_name, email, is_active, plan_type, created_at, website_slug');

  console.log('📊 Sem Order By Result:', {
    count: noOrderData?.length || 0,
    error: noOrderError?.message || 'sem erro'
  });

  console.log('');
  console.log('🎯 CONCLUSÃO:');
  if (serviceData && serviceData.length === 1) {
    console.log('🚨 SERVICE ROLE TAMBÉM ESTÁ LIMITADO!');
    console.log('💡 Possíveis causas:');
    console.log('   - Política RLS muito restritiva');
    console.log('   - Filtro de linha oculto na tabela');
    console.log('   - Problema de permissões específico');
    console.log('   - Dados foram deletados/corrompidos');
  }
})();