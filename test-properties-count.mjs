import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 TESTANDO CAMPO PROPERTIES_COUNT');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPropertiesCount() {
  try {
    // 1. Testar se campo properties_count existe
    console.log('\n📋 TESTE 1: Buscar com properties_count');
    const { data: withCount, error: countError } = await supabase
      .from('brokers')
      .select('id, business_name, properties_count')
      .limit(2);
    
    if (countError) {
      console.error('❌ ERRO properties_count:', countError.message);
      console.log('💡 CAMPO properties_count NÃO EXISTE na tabela brokers');
    } else {
      console.log('✅ Campo properties_count existe!');
      withCount?.forEach(broker => {
        console.log(`   ${broker.business_name}: ${broker.properties_count || 0} propriedades`);
      });
    }

    // 2. Fazer agregação manual
    console.log('\n📋 TESTE 2: Agregação manual de propriedades');
    const { data: manualCount, error: manualError } = await supabase
      .from('brokers')
      .select(`
        id, 
        business_name, 
        email,
        properties:properties(count)
      `);
    
    if (manualError) {
      console.error('❌ ERRO agregação:', manualError.message);
    } else {
      console.log('✅ Agregação manual funcionou!');
      manualCount?.forEach(broker => {
        const count = broker.properties?.[0]?.count || 0;
        console.log(`   ${broker.business_name}: ${count} propriedades`);
      });
    }

    // 3. Alternativa: JOIN com COUNT
    console.log('\n📋 TESTE 3: Query SQL direta com COUNT');
    const { data: sqlCount, error: sqlError } = await supabase
      .rpc('get_brokers_with_property_count');
    
    if (sqlError) {
      console.log('⚠️  Função get_brokers_with_property_count não existe');
      console.log('💡 SOLUÇÃO: Criar função SQL ou usar agregação no frontend');
    } else {
      console.log('✅ Função SQL funcionou!');
      sqlCount?.forEach(broker => {
        console.log(`   ${broker.business_name}: ${broker.properties_count} propriedades`);
      });
    }

  } catch (error) {
    console.error('💥 ERRO GERAL:', error.message);
  }
}

testPropertiesCount();