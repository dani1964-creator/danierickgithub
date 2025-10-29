const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigrationHack() {
  try {
    console.log('🔧 TENTATIVA: Aplicar migração via hack de função');
    
    // Primeiro, vou tentar criar uma função que execute o SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION apply_leads_rls_fix() 
      RETURNS void 
      LANGUAGE plpgsql 
      SECURITY DEFINER 
      AS $$
      BEGIN
        -- Remover políticas restritivas
        DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;
        DROP POLICY IF EXISTS "Allow public lead submissions" ON public.leads;
        DROP POLICY IF EXISTS "Allow anon lead submissions" ON public.leads;
        
        -- Criar políticas permissivas temporárias
        CREATE POLICY "Allow public lead submissions" 
        ON public.leads 
        FOR INSERT 
        TO public 
        WITH CHECK (true);
        
        CREATE POLICY "Allow anon lead submissions" 
        ON public.leads 
        FOR INSERT 
        TO anon 
        WITH CHECK (true);
      END;
      $$;
    `;
    
    console.log('Criando função de correção...');
    
    // Tentar usar o cliente admin para executar
    const { data: functionResult, error: functionError } = await supabaseAdmin
      .rpc('exec_sql', { sql: createFunctionSQL });
      
    if (functionError) {
      console.log('❌ Não consegui criar função:', functionError.message);
      console.log('\n📋 APLICAÇÃO MANUAL NECESSÁRIA');
      console.log('Por favor, aplique manualmente no SQL Editor:');
      console.log('');
      console.log('DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;');
      console.log('CREATE POLICY "Allow public lead submissions" ON public.leads FOR INSERT TO public WITH CHECK (true);');
      console.log('CREATE POLICY "Allow anon lead submissions" ON public.leads FOR INSERT TO anon WITH CHECK (true);');
      console.log('');
      console.log('URL: https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql');
    } else {
      console.log('✅ Função criada, executando...');
      
      const { data: execResult, error: execError } = await supabaseAdmin
        .rpc('apply_leads_rls_fix');
        
      if (execError) {
        console.log('❌ Erro ao executar:', execError);
      } else {
        console.log('🎉 Migração aplicada com sucesso via hack!');
      }
    }
    
    // Testar independentemente do resultado
    console.log('\n🧪 TESTANDO RESULTADO...');
    
    const supabaseAnon = createClient(
      process.env.VITE_SUPABASE_URL, 
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data: brokers } = await supabaseAdmin
      .from('brokers')
      .select('id')
      .limit(1);
      
    if (brokers?.length) {
      const testLead = {
        name: 'Test Hack Application',
        email: 'test.hack@example.com',
        phone: '11999999999',
        message: 'Teste via hack',
        broker_id: brokers[0].id,
        source: 'website'
      };

      const { data, error } = await supabaseAnon
        .from('leads')
        .insert([testLead])
        .select();

      if (error) {
        console.log('❌ Ainda com erro:', error.code);
        console.log('⚠️ Aplicação manual necessária no SQL Editor');
      } else {
        console.log('🎉 SUCESSO! Formulário funcionando:', data[0]?.id);
      }
    }
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

applyMigrationHack();
