const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

async function verificarEstrutura() {
  console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Verificar propriedades
    console.log('1️⃣ Verificando tabela properties...');
    const { data: props, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (props && props[0]) {
      console.log('✅ Colunas da tabela properties:', Object.keys(props[0]));
    }

    // Verificar brokers  
    console.log('\n2️⃣ Verificando tabela brokers...');
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('*')
      .limit(1);

    if (brokers && brokers[0]) {
      console.log('✅ Colunas da tabela brokers:', Object.keys(brokers[0]));
    }

    // Verificar categorias
    console.log('\n3️⃣ Verificando tabela property_categories...');
    const { data: categories, error: catError } = await supabase
      .from('property_categories')
      .select('*')
      .limit(1);

    if (categories && categories[0]) {
      console.log('✅ Colunas da tabela property_categories:', Object.keys(categories[0]));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarEstrutura();