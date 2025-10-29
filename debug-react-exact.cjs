require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🔍 TESTE ESPECÍFICO: Por que só 1 broker aparece no React?');
  console.log('');

  // Testar com EXATAMENTE a mesma configuração do React
  const supabaseServiceRole = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Query EXATA do fetchBrokers
  console.log('1️⃣ QUERY EXATA DO fetchBrokers():');
  const { data: brokersData, error: brokersError } = await supabaseServiceRole
    .from('brokers')
    .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
    .order('created_at', { ascending: false });

  console.log('📊 Resposta Supabase (Service Role):', { 
    count: brokersData?.length || 0, 
    error: brokersError?.message || 'nenhum erro'
  });

  if (brokersData) {
    brokersData.forEach((b, i) => {
      console.log(`   ${i+1}. ${b.business_name} (${b.email}) - ${b.is_active ? 'ATIVA' : 'INATIVA'}`);
    });
  }

  // 2. Simular contagem de propriedades
  console.log('');
  console.log('2️⃣ SIMULANDO CONTAGEM DE PROPRIEDADES:');
  
  if (brokersData) {
    const brokersWithCounts = await Promise.all(
      brokersData.map(async (broker) => {
        const { count } = await supabaseServiceRole
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', broker.id);

        console.log(`   ${broker.business_name}: ${count || 0} propriedades`);
        return { ...broker, properties_count: count || 0 };
      })
    );

    console.log('');
    console.log('✅ RESULTADO FINAL QUE DEVERIA CHEGAR NO setBrokers():');
    console.log(`📊 Total: ${brokersWithCounts.length} brokers`);
    brokersWithCounts.forEach((b, i) => {
      console.log(`   ${i+1}. ${b.business_name} (${b.email}) - ${b.properties_count} props`);
    });
  }

  console.log('');
  console.log('🎯 CONCLUSÃO:');
  if (brokersData && brokersData.length === 6) {
    console.log('✅ Supabase retorna 6 brokers - problema é no React setState/render!');
  } else {
    console.log('❌ Problema é no Supabase - dados não chegam corretamente!');
  }
})();