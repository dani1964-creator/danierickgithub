const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 APLICANDO CORREÇÃO COMPLETA DAS POLÍTICAS RLS');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function applyFullRLSFix() {
  try {
    console.log('\n📋 PASSO 1: Verificando estado atual...');
    
    // Buscar um broker para testes
    const { data: brokers, error: brokersError } = await supabaseAdmin
      .from('brokers')
      .select('id, business_name')
      .limit(1);
    
    if (brokersError || !brokers?.length) {
      console.error('❌ Erro ao buscar broker:', brokersError);
      return;
    }

    const brokerId = brokers[0].id;
    console.log('✅ Broker encontrado:', brokers[0].business_name);

    // Testar estado atual (deve falhar)
    console.log('\n📋 PASSO 2: Confirmando problema atual...');
    const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const testBefore = {
      name: 'Test Before Fix',
      email: 'test.before@example.com',
      phone: '11999999999',
      message: 'Teste antes da correção',
      broker_id: brokerId,
      source: 'website'
    };

    const { error: beforeError } = await supabaseAnon
      .from('leads')
      .insert([testBefore]);

    if (beforeError) {
      console.log('✅ Problema confirmado - usuário anônimo bloqueado:', beforeError.code);
    } else {
      console.log('⚠️ Problema já pode estar resolvido');
    }

    console.log('\n📋 PASSO 3: Aplicando correção usando função personalizada...');
    
    // Vou usar uma abordagem diferente - criar uma função que execute SQL
    const sqlCommands = [
      `DO $$ 
       BEGIN
         -- Remover políticas antigas
         DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;
         DROP POLICY IF EXISTS "Allow public lead submissions" ON public.leads;
         DROP POLICY IF EXISTS "Allow anon lead submissions" ON public.leads;
         
         -- Criar novas políticas permissivas com rate limiting
         CREATE POLICY "Allow public lead submissions with rate limit" 
         ON public.leads 
         FOR INSERT 
         TO public 
         WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));
         
         CREATE POLICY "Allow anon lead submissions with rate limit" 
         ON public.leads 
         FOR INSERT 
         TO anon 
         WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));
       END $$;`
    ];

    // Tentar aplicar via RPC direto
    for (const sql of sqlCommands) {
      try {
        // Usar a biblioteca pg diretamente seria ideal, mas vamos tentar com uma função
        console.log('Executando correção SQL...');
        
        // Como não posso executar SQL diretamente, vou criar uma migração válida
        const migrationContent = sql.replace('DO $$', '').replace('BEGIN', '').replace('END $$;', '');
        
        console.log('📝 SQL para aplicar manualmente:');
        console.log('\n' + '='.repeat(50));
        console.log(migrationContent);
        console.log('='.repeat(50));
        
      } catch (error) {
        console.error('Erro ao executar SQL:', error);
      }
    }

    console.log('\n📋 PASSO 4: Aguardando aplicação manual e testando...');
    console.log('Por favor, aplique o SQL acima no SQL Editor do Supabase.');
    console.log('Depois execute: node test-after-fix.cjs');
    
    // Criar script de teste
    const testScript = `const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAfterFix() {
  try {
    const testLead = {
      name: 'Test After Fix',
      email: 'test.after.fix@example.com',
      phone: '11999999999',
      message: 'Teste após correção',
      broker_id: '${brokerId}',
      source: 'website'
    };

    const { data, error } = await supabaseAnon
      .from('leads')
      .insert([testLead])
      .select();

    if (error) {
      console.error('❌ AINDA com erro:', error);
    } else {
      console.log('🎉 SUCESSO! Formulário funcionando:', data[0]?.id);
    }
  } catch (err) {
    console.error('💥 Erro:', err);
  }
}

testAfterFix();`;

    require('fs').writeFileSync('test-after-fix.cjs', testScript);
    console.log('✅ Script de teste criado: test-after-fix.cjs');

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

applyFullRLSFix();