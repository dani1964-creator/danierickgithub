require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🔍 DIAGNÓSTICO: CÓDIGO vs SUPABASE RLS');
  console.log('');

  // Testar com Service Role (bypassa RLS)
  const supabaseServiceRole = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('1️⃣ TESTE COM SERVICE ROLE (bypassa RLS):');
  const { data: serviceData, error: serviceError } = await supabaseServiceRole
    .from('brokers')
    .select('id, business_name, email, is_active, plan_type')
    .order('created_at', { ascending: false });

  if (serviceError) {
    console.log('❌ Erro com Service Role:', serviceError.message);
  } else {
    console.log(`✅ Service Role encontrou: ${serviceData.length} brokers`);
    serviceData.forEach((b, i) => {
      console.log(`  ${i+1}. ${b.business_name} - ${b.is_active ? 'ATIVA' : 'INATIVA'}`);
    });
  }

  console.log('');

  // Testar com Anon Key (usa RLS)
  const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  console.log('2️⃣ TESTE COM ANON KEY (usa RLS):');
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('brokers')
    .select('id, business_name, email, is_active, plan_type')
    .order('created_at', { ascending: false });

  if (anonError) {
    console.log('❌ Erro com Anon Key:', anonError.message);
    console.log('🎯 PROBLEMA IDENTIFICADO: RLS está bloqueando!');
  } else {
    console.log(`✅ Anon Key encontrou: ${anonData.length} brokers`);
    if (anonData.length === 0) {
      console.log('🎯 PROBLEMA IDENTIFICADO: RLS permite query mas retorna 0 registros!');
    }
  }

  console.log('');
  console.log('🔍 CONCLUSÃO:');
  if (serviceData && serviceData.length > 0) {
    if (!anonData || anonData.length === 0) {
      console.log('🎯 PROBLEMA É RLS! Dados existem mas RLS bloqueia acesso anônimo.');
      console.log('💡 SOLUÇÃO: Usar service role no SuperAdmin ou ajustar políticas RLS.');
    } else {
      console.log('✅ CÓDIGO ESTÁ CORRETO! Dados acessíveis via RLS.');
    }
  } else {
    console.log('🎯 PROBLEMA É DADOS! Não há brokers na tabela.');
  }
})();