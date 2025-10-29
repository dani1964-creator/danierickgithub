const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 APLICANDO CORREÇÃO DAS POLÍTICAS RLS DE LEADS');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  try {
    console.log('\n📋 TESTANDO INSERÇÃO COMO ADMIN PRIMEIRO...');
    
    // Buscar um broker para testar
    const { data: brokers, error: brokersError } = await supabaseAdmin
      .from('brokers')
      .select('id, business_name')
      .limit(1);
    
    if (brokersError || !brokers?.length) {
      console.error('❌ Erro ao buscar broker:', brokersError);
      return;
    }

    const brokerId = brokers[0].id;
    console.log('✅ Usando broker:', brokers[0].business_name);

    // Testar inserção como admin primeiro
    const adminTestLead = {
      name: 'Admin Test RLS',
      email: 'admin.test.rls@example.com',
      phone: '11999999999',
      message: 'Teste admin para verificar estrutura',
      broker_id: brokerId,
      source: 'admin_test'
    };

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('leads')
      .insert([adminTestLead])
      .select();

    if (adminError) {
      console.error('❌ Erro mesmo como admin:', adminError);
      return;
    } else {
      console.log('✅ Admin conseguiu inserir lead:', adminData[0]?.id);
    }

    console.log('\n📋 TESTANDO INSERÇÃO COMO ANÔNIMO...');
    
    // Testar com cliente anônimo
    const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const testLead = {
      name: 'Teste Anônimo',
      email: 'teste.anonimo.rls@example.com',
      phone: '11999999999',
      message: 'Lead de teste como usuário anônimo',
      broker_id: brokerId,
      source: 'website'
    };

    const { data: leadData, error: leadError } = await supabaseAnon
      .from('leads')
      .insert([testLead])
      .select();

    if (leadError) {
      console.error('❌ Erro ao inserir como anônimo (PROBLEMA CONFIRMADO):', leadError);
      console.log('\n🔧 APLICANDO CORREÇÃO TEMPORÁRIA...');
      
      // Vamos criar uma política mais permissiva temporariamente
      const tempPolicy = `
        CREATE POLICY "temp_allow_all_lead_inserts_for_testing" 
        ON public.leads 
        FOR INSERT 
        TO public
        WITH CHECK (true);
      `;
      
      // Tentar aplicar usando uma função customizada ou SQL direto
      console.log('📝 Para corrigir, execute manualmente no Supabase SQL Editor:');
      console.log('');
      console.log('-- 1. Remover políticas restritivas');
      console.log('DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;');
      console.log('');
      console.log('-- 2. Criar nova política permissiva');
      console.log('CREATE POLICY "Allow public lead submissions" ON public.leads FOR INSERT TO public WITH CHECK (true);');
      console.log('CREATE POLICY "Allow anon lead submissions" ON public.leads FOR INSERT TO anon WITH CHECK (true);');
      console.log('');
      console.log('🎯 SOLUÇÃO: Acesse https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql');
      
    } else {
      console.log('🎉 SUCESSO! Lead inserido como anônimo:', leadData[0]?.id);
      console.log('✅ PROBLEMA JÁ ESTÁ RESOLVIDO!');
    }

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

applyRLSFix();
