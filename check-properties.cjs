require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProperties() {
  console.log('🏠 Verificando propriedades por imobiliária...\n');

  try {
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, business_name, email')
      .order('business_name');

    if (brokersError) {
      console.error('❌ Erro ao buscar imobiliárias:', brokersError);
      return;
    }

    for (const broker of brokers) {
      const { count, error: countError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('broker_id', broker.id);

      console.log(`🏢 ${broker.business_name || 'Sem nome'} (${broker.email})`);
      console.log(`   Propriedades: ${count || 0}`);
      console.log('');
    }

    // Foco no danierick
    const danierick = brokers.find(b => b.email === 'danierick.erick@hotmail.com');
    if (danierick) {
      console.log('🔍 FOCO: danierick.erick@hotmail.com');
      console.log(`   ID: ${danierick.id}`);
      
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, type, price')
        .eq('broker_id', danierick.id);

      if (error) {
        console.error('❌ Erro:', error);
      } else {
        console.log(`   Total: ${properties.length} propriedades`);
        properties.forEach((prop, idx) => {
          console.log(`   ${idx + 1}. ${prop.title} - ${prop.type}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkProperties();
