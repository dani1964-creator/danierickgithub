import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA BROKERS');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    // 1. Testar query básica para ver que colunas existem
    console.log('\n📋 TESTE 1: Query básica (SELECT *)');
    const { data: basicData, error: basicError } = await supabase
      .from('brokers')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.error('❌ ERRO:', basicError.message);
    } else if (basicData && basicData.length > 0) {
      console.log('✅ Primeira linha encontrada:');
      console.log('📋 Colunas disponíveis:', Object.keys(basicData[0]));
      console.log('📋 Dados:', basicData[0]);
    }

    // 2. Testar query com business_name (nome correto)
    console.log('\n📋 TESTE 2: Query com business_name');
    const { data: businessData, error: businessError } = await supabase
      .from('brokers')
      .select('id, business_name, email, is_active, created_at');
    
    if (businessError) {
      console.error('❌ ERRO business_name:', businessError.message);
    } else {
      console.log('✅ Query business_name funcionou!');
      console.log('📊 Total encontrado:', businessData?.length);
      businessData?.forEach((broker, index) => {
        console.log(`   ${index + 1}. ${broker.business_name} (${broker.email})`);
      });
    }

  } catch (error) {
    console.error('💥 ERRO GERAL:', error.message);
  }
}

checkTableStructure();