require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🔍 INVESTIGANDO: Por que só danierick.erick@hotmail.com aparece no /admin');
  console.log('');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // 1. Buscar TODOS os brokers
  console.log('1️⃣ TODOS OS BROKERS NA TABELA:');
  const { data: allBrokers, error: allError } = await supabase
    .from('brokers')
    .select('*')
    .order('created_at', { ascending: false });

  if (allError) {
    console.log('❌ Erro:', allError.message);
    return;
  }

  allBrokers.forEach((broker, i) => {
    console.log(`  ${i+1}. ${broker.business_name || 'SEM NOME'}`);
    console.log(`     Email: ${broker.email}`);
    console.log(`     ID: ${broker.id}`);
    console.log(`     Ativo: ${broker.is_active}`);
    console.log(`     Plano: ${broker.plan_type}`);
    console.log(`     Criado: ${broker.created_at}`);
    console.log(`     Website: ${broker.website_slug || 'SEM SLUG'}`);
    console.log('');
  });

  // 2. Buscar especificamente danierick.erick@hotmail.com
  console.log('2️⃣ DADOS ESPECÍFICOS DO danierick.erick@hotmail.com:');
  const { data: specificBroker } = await supabase
    .from('brokers')
    .select('*')
    .eq('email', 'danierick.erick@hotmail.com')
    .single();

  if (specificBroker) {
    console.log('📋 DADOS COMPLETOS:');
    Object.keys(specificBroker).forEach(key => {
      console.log(`   ${key}: ${specificBroker[key]}`);
    });
  } else {
    console.log('❌ Não encontrado!');
  }

  // 3. Comparar diferenças
  console.log('');
  console.log('3️⃣ COMPARANDO DIFERENÇAS:');
  
  // Verificar se tem algum campo que pode estar filtrando
  const fields = ['is_active', 'plan_type', 'website_slug', 'email_verified', 'status'];
  
  for (const field of fields) {
    const uniqueValues = [...new Set(allBrokers.map(b => b[field]))];
    console.log(`   Campo "${field}": ${uniqueValues.join(', ')}`);
  }

  // 4. Testar query exata do frontend
  console.log('');
  console.log('4️⃣ TESTANDO QUERY EXATA DO FRONTEND:');
  const { data: frontendData, error: frontendError } = await supabase
    .from('brokers')
    .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
    .order('created_at', { ascending: false });

  if (frontendError) {
    console.log('❌ Erro na query frontend:', frontendError.message);
  } else {
    console.log(`✅ Query frontend retornou: ${frontendData.length} brokers`);
    frontendData.forEach((b, i) => {
      console.log(`   ${i+1}. ${b.business_name} (${b.email})`);
    });
  }

  console.log('');
  console.log('🎯 CONCLUSÃO:');
  if (allBrokers.length > frontendData.length) {
    console.log('� PROBLEMA: Query do frontend filtra alguns brokers!');
  } else if (frontendData.length === allBrokers.length) {
    console.log('✅ Query do frontend está correta - problema deve ser no React!');
  }
})();