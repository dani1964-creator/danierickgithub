require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verificarImobiliarias() {
  console.log('🔍 Verificando todas as imobiliárias no sistema...\n');

  try {
    // Buscar todas as imobiliárias
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, business_name, display_name, email, is_active, plan_type, created_at, website_slug')
      .order('created_at', { ascending: false });

    if (brokersError) {
      console.error('❌ Erro ao buscar imobiliárias:', brokersError);
      return;
    }

    console.log(`📊 TOTAL DE IMOBILIÁRIAS ENCONTRADAS: ${brokers.length}\n`);
    
    // Listar todas as imobiliárias
    brokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.business_name || 'Sem nome'}`);
      console.log(`   Email: ${broker.email}`);
      console.log(`   Slug: ${broker.website_slug || 'Não definido'}`);
      console.log(`   Status: ${broker.is_active ? '✅ Ativa' : '❌ Inativa'}`);
      console.log(`   Plano: ${broker.plan_type}`);
      console.log(`   Criado em: ${new Date(broker.created_at).toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // Verificar especificamente as ativas
    const ativas = brokers.filter(b => b.is_active);
    const inativas = brokers.filter(b => !b.is_active);
    
    console.log(`📈 RESUMO:`);
    console.log(`   Total: ${brokers.length} imobiliárias`);
    console.log(`   Ativas: ${ativas.length} imobiliárias`);
    console.log(`   Inativas: ${inativas.length} imobiliárias`);

    if (inativas.length > 0) {
      console.log(`\n⚠️  IMOBILIÁRIAS INATIVAS:`);
      inativas.forEach(broker => {
        console.log(`   - ${broker.business_name || 'Sem nome'} (${broker.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarImobiliarias();