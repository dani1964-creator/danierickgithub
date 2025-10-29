import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 TESTANDO E CORRIGINDO POLÍTICAS RLS DE LEADS');

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testLeadsRLS() {
  try {
    console.log('\n📋 TESTE: Buscar broker válido');
    
    const { data: brokers, error: brokersError } = await supabaseAdmin
      .from('brokers')
      .select('id, business_name')
      .limit(1);
    
    if (brokersError) {
      console.error('❌ ERRO ao buscar brokers:', brokersError);
      return;
    }

    if (!brokers || brokers.length === 0) {
      console.log('❌ Nenhum broker encontrado');
      return;
    }

    const brokerId = brokers[0].id;
    console.log('✅ Usando broker:', brokers[0].business_name, 'ID:', brokerId);

    // Teste 1: Inserir como admin (deve funcionar)
    console.log('\n📋 TESTE 1: Inserir lead como ADMIN');
    
    const adminLeadData = {
      name: 'Admin Test',
      email: 'admin.test@example.com',
      phone: '11999999998',
      message: 'Teste de admin',
      broker_id: brokerId,
      source: 'admin_test'
    };

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('leads')
      .insert([adminLeadData])
      .select();

    if (adminError) {
      console.error('❌ ERRO ao inserir lead como admin:', adminError);
    } else {
      console.log('✅ Lead inserido como admin:', adminData[0]?.id);
    }

    // Teste 2: Inserir como usuário anônimo (problema atual)
    console.log('\n📋 TESTE 2: Inserir lead como ANÔNIMO');
    
    const anonLeadData = {
      name: 'João Anônimo',
      email: 'joao.anonimo@example.com',
      phone: '11999999999',
      message: 'Teste de usuário anônimo',
      broker_id: brokerId,
      source: 'website'
    };

    const { data: anonData, error: anonError } = await supabase
      .from('leads')
      .insert([anonLeadData])
      .select();

    if (anonError) {
      console.error('❌ ERRO ao inserir lead como anônimo:', anonError);
      
      // Vamos tentar uma abordagem diferente - inserir sem RLS
      console.log('\n🔧 TENTATIVA: Usar admin para inserir simulando anônimo');
      
      const { data: adminForAnonData, error: adminForAnonError } = await supabaseAdmin
        .from('leads')
        .insert([{
          ...anonLeadData,
          email: 'admin.for.anon@example.com'
        }])
        .select();

      if (adminForAnonError) {
        console.error('❌ Erro mesmo como admin:', adminForAnonError);
      } else {
        console.log('✅ Admin conseguiu inserir:', adminForAnonData[0]?.id);
        console.log('🔍 Isso confirma que o problema é na política RLS, não na estrutura da tabela');
      }
      
    } else {
      console.log('✅ Lead inserido como anônimo:', anonData[0]?.id);
    }

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

testLeadsRLS();