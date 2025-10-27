import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Corrigido!

console.log('🔧 TESTANDO ACESSO COM CHAVE ANÔNIMA (como o frontend)');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseAnonKey ? 'ENCONTRADA' : 'NÃO ENCONTRADA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente faltando!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendAccess() {
  try {
    console.log('\n🔍 TESTE: Query EXATA do useOptimizedBrokers');
    
    const { data, error } = await supabase
      .from('brokers')
      .select('id, business_name, email, is_active, created_at, city, estado, telefone');
    
    if (error) {
      console.error('❌ ERRO RLS/PERMISSÃO:', error.message);
      console.error('📋 Código:', error.code);
      console.error('📋 Detalhes:', error.details);
      console.log('\n💡 SOLUÇÃO: Execute o SQL fix-rls-policies.sql no Supabase!');
    } else {
      console.log('✅ Query funcionou!');
      console.log('📊 Total encontrado:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Registros:');
        data.forEach((broker, index) => {
          console.log(`   ${index + 1}. ${broker.business_name} (${broker.email})`);
        });
        
        const filtered = data.filter(broker => broker.email !== 'danierickcreator@gmail.com');
        console.log('\n📊 IMOBILIÁRIAS (sem Super Admin):', filtered.length);
        console.log('✅ FRONTEND DEVERIA MOSTRAR ESSAS IMOBILIÁRIAS!');
      }
    }
  } catch (error) {
    console.error('💥 ERRO GERAL:', error.message);
  }
}

testFrontendAccess();
