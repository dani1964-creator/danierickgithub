require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSuperAdminData() {
  console.log('🔍 Testando dados do SuperAdmin...\n');

  try {
    // 1. Buscar todos os brokers
    console.log('1. Buscando brokers...');
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, business_name, display_name, email, is_active, plan_type, created_at')
      .order('created_at', { ascending: false });

    if (brokersError) {
      console.error('❌ Erro ao buscar brokers:', brokersError);
      return;
    }

    console.log(`✅ Encontrados ${brokers.length} brokers`);
    
    // 2. Para cada broker, buscar contagem de propriedades
    console.log('\n2. Buscando contagem de propriedades por broker...');
    
    for (const broker of brokers) {
      const { count, error: countError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('broker_id', broker.id);

      if (countError) {
        console.error(`❌ Erro ao contar propriedades do broker ${broker.business_name}:`, countError);
        continue;
      }

      console.log(`📊 ${broker.business_name} (${broker.email}): ${count || 0} propriedades`);
      
      // Verificar especificamente o danierick.erick@hotmail.com
      if (broker.email === 'danierick.erick@hotmail.com') {
        console.log(`\n🔍 DADOS DETALHADOS - ${broker.business_name}:`);
        console.log(`   ID: ${broker.id}`);
        console.log(`   Email: ${broker.email}`);
        console.log(`   Ativo: ${broker.is_active ? 'Sim' : 'Não'}`);
        console.log(`   Plano: ${broker.plan_type}`);
        console.log(`   Propriedades: ${count || 0}`);
        
        // Buscar propriedades detalhadas
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('id, title, is_active, created_at')
          .eq('broker_id', broker.id)
          .order('created_at', { ascending: false });

        if (!propError && properties) {
          console.log(`   Propriedades detalhadas:`);
          properties.forEach((prop, index) => {
            console.log(`     ${index + 1}. ${prop.title} (${prop.is_active ? 'Ativa' : 'Inativa'})`);
          });
        }
      }
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSuperAdminData();