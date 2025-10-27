import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBrokers() {
  console.log('🔍 Verificando brokers no banco...');
  
  try {
    const { data: brokers, error } = await supabase
      .from('brokers')
      .select('id, business_name, email, is_active')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao consultar brokers:', error);
      return;
    }
    
    console.log(`✅ Encontrados ${brokers.length} brokers:`);
    brokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.business_name} (${broker.email}) - ${broker.is_active ? 'Ativo' : 'Inativo'}`);
    });
    
    if (brokers.length === 0) {
      console.log('ℹ️ Nenhum broker encontrado. O SuperAdmin deve mostrar uma lista vazia.');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

checkBrokers();