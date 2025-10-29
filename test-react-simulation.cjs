require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🧪 SIMULANDO EXATAMENTE O QUE O REACT DEVERIA FAZER');
  console.log('');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // 1. Simular fetchBrokers() exato
  console.log('1️⃣ SIMULANDO fetchBrokers() do React:');
  
  const { data: brokersData, error: brokersError } = await supabase
    .from('brokers')
    .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
    .order('created_at', { ascending: false });

  if (brokersError) {
    console.log('❌ Erro:', brokersError.message);
    return;
  }

  console.log(`📊 Brokers retornados pelo Supabase: ${brokersData.length}`);
  brokersData.forEach((b, i) => {
    console.log(`   ${i+1}. ${b.business_name} (${b.email}) - ${b.is_active ? 'ATIVA' : 'INATIVA'}`);
  });

  // 2. Simular busca de propriedades
  console.log('');
  console.log('2️⃣ SIMULANDO busca de propriedades por broker:');
  
  const brokersWithCounts = await Promise.all(
    brokersData.map(async (broker) => {
      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('broker_id', broker.id);

      return { ...broker, properties_count: count || 0 };
    })
  );

  console.log(`📊 Brokers processados: ${brokersWithCounts.length}`);
  brokersWithCounts.forEach((b, i) => {
    console.log(`   ${i+1}. ${b.business_name} (${b.email}) - ${b.properties_count} propriedades`);
  });

  // 3. Testar se há alguma diferença
  console.log('');
  console.log('3️⃣ ANALISANDO DIFERENÇAS:');
  
  const onlyOne = brokersWithCounts.filter(b => b.email === 'danierick.erick@hotmail.com');
  if (onlyOne.length > 0) {
    console.log('🔍 Dados específicos de danierick.erick@hotmail.com:');
    console.log(JSON.stringify(onlyOne[0], null, 2));
  }

  // 4. Verificar se há algum campo único
  console.log('');
  console.log('4️⃣ VERIFICANDO CAMPOS ÚNICOS:');
  
  const uniqueFields = {};
  brokersWithCounts.forEach(broker => {
    Object.keys(broker).forEach(key => {
      if (!uniqueFields[key]) uniqueFields[key] = new Set();
      uniqueFields[key].add(broker[key]);
    });
  });

  Object.keys(uniqueFields).forEach(field => {
    const values = Array.from(uniqueFields[field]);
    if (values.length > 1) {
      console.log(`   ${field}: ${values.join(', ')}`);
    }
  });

  console.log('');
  console.log('🎯 RESULTADO ESPERADO NO REACT:');
  console.log(`   - Total de brokers: ${brokersWithCounts.length}`);
  console.log(`   - Brokers ativos: ${brokersWithCounts.filter(b => b.is_active).length}`);
  console.log(`   - Total de propriedades: ${brokersWithCounts.reduce((sum, b) => sum + b.properties_count, 0)}`);
  
  if (brokersWithCounts.length === 6) {
    console.log('✅ DADOS CORRETOS - Problema deve ser no estado React!');
  } else {
    console.log('❌ DADOS INCORRETOS - Problema na query Supabase!');
  }
})();