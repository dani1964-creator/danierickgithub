const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 VERIFICANDO POLÍTICAS RLS ATUAIS');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function inspectRLSPolicies() {
  try {
    console.log('\n📋 CONSULTANDO POLÍTICAS ATUAIS...');
    
    // Buscar políticas da tabela leads
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'leads');
    
    if (policiesError) {
      console.error('❌ Erro ao buscar políticas:', policiesError);
      
      // Tentar uma consulta SQL direta
      console.log('\n🔍 Tentando consulta SQL direta...');
      
      const { data: sqlResult, error: sqlError } = await supabaseAdmin
        .rpc('exec_sql', { 
          query: `
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies 
            WHERE tablename = 'leads';
          `
        });
      
      if (sqlError) {
        console.error('❌ Erro na consulta SQL:', sqlError);
      } else {
        console.log('✅ Políticas encontradas via SQL:', sqlResult);
      }
    } else {
      console.log('✅ Políticas atuais:');
      policies.forEach((policy, index) => {
        console.log(`${index + 1}. Nome: ${policy.policyname}`);
        console.log(`   Comando: ${policy.cmd}`);
        console.log(`   Roles: ${policy.roles}`);
        console.log(`   Condição: ${policy.with_check || policy.qual}`);
        console.log('');
      });
    }

    console.log('\n🔧 TENTANDO APLICAR CORREÇÃO ATRAVÉS DE RPC...');
    
    // Tentar diferentes abordagens para executar SQL
    const sqlCommands = [
      'DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;',
      'CREATE POLICY "Allow anon lead submissions" ON public.leads FOR INSERT TO anon WITH CHECK (true);'
    ];
    
    for (const command of sqlCommands) {
      console.log(`Executando: ${command.substring(0, 50)}...`);
      
      try {
        // Tentar diferentes nomes de função RPC
        const rpcNames = ['sql', 'exec_sql', 'execute_sql', 'raw_sql'];
        
        for (const rpcName of rpcNames) {
          try {
            const { data, error } = await supabaseAdmin.rpc(rpcName, { 
              query: command 
            });
            
            if (!error) {
              console.log(`✅ Sucesso com RPC ${rpcName}`);
              break;
            }
          } catch (err) {
            // Continua tentando outros nomes
          }
        }
        
      } catch (err) {
        console.log(`❌ RPC não funcionou para: ${command.substring(0, 30)}...`);
      }
    }

    console.log('\n📝 INSTRUÇÕES MANUAIS:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql');
    console.log('2. Execute o seguinte SQL:');
    console.log('');
    console.log('-- Remover política restritiva');
    console.log('DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;');
    console.log('');
    console.log('-- Criar políticas permissivas');
    console.log('CREATE POLICY "Allow public lead submissions" ON public.leads FOR INSERT TO public WITH CHECK (true);');
    console.log('CREATE POLICY "Allow anon lead submissions" ON public.leads FOR INSERT TO anon WITH CHECK (true);');
    console.log('');
    console.log('3. Teste novamente executando: node apply-rls-fix.cjs');

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

inspectRLSPolicies();