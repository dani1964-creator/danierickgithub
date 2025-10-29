import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 APLICANDO CORREÇÃO DAS POLÍTICAS RLS DE LEADS');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  try {
    console.log('\n📋 APLICANDO SQL DIRETAMENTE...');
    
    // Aplicar cada comando SQL separadamente
    const commands = [
      'DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;',
      'DROP POLICY IF EXISTS "Allow public lead submissions with rate limiting" ON public.leads;',
      'DROP POLICY IF EXISTS "Allow anon lead submissions with rate limiting" ON public.leads;',
      'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY "Allow public lead submissions with rate limiting" 
       ON public.leads 
       FOR INSERT 
       TO public
       WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));`,
      `CREATE POLICY "Allow anon lead submissions with rate limiting" 
       ON public.leads 
       FOR INSERT 
       TO anon
       WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));`
    ];

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`Executando comando ${i + 1}/${commands.length}:`, command.substring(0, 50) + '...');
      
      try {
        const { data, error } = await supabaseAdmin.rpc('exec', { 
          statements: [{ statement: command }] 
        });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (cmdError) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, cmdError);
      }
    }

    console.log('\n🔧 Testando inserção após correção...');
    
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

    // Testar com cliente anônimo
    const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const testLead = {
      name: 'Teste Após Correção',
      email: 'teste.pos.correcao@example.com',
      phone: '11999999999',
      message: 'Lead de teste após aplicar correção RLS',
      broker_id: brokerId,
      source: 'website'
    };

    const { data: leadData, error: leadError } = await supabaseAnon
      .from('leads')
      .insert([testLead])
      .select();

    if (leadError) {
      console.error('❌ AINDA com erro ao inserir como anônimo:', leadError);
    } else {
      console.log('🎉 SUCESSO! Lead inserido como anônimo:', leadData[0]?.id);
      console.log('✅ PROBLEMA DE FORMULÁRIO RESOLVIDO!');
    }

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

applyRLSFix();