require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  console.log('🔍 Teste simples SuperAdmin...');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data, error, count } = await supabase
    .from('brokers')
    .select('business_name, email, is_active', { count: 'exact' });

  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log(`✅ ${count} brokers encontrados:`);
    data.forEach((b, i) => console.log(`${i+1}. ${b.business_name} - ${b.is_active ? 'Ativa' : 'Inativa'}`));
  }
}

test();
