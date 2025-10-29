require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verificarPropriedadesPorImobiliaria() {
  console.log('🏠 Verificando propriedades por imobiliária...\n');

  try {
    // Buscar todas as imobiliárias
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, business_name, email, website_slug')
      .order('created_at', { ascending: false });

    if (brokersError) {
      console.error('❌ Erro ao buscar imobiliárias:', brokersError);
      return;
    }

    console.log(`📊 Verificando propriedades para ${brokers.length} imobiliárias:\n`);

    // Para cada imobiliária, contar propriedades
    for (const broker of brokers) {
      const { count, error: countError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('broker_id', broker.id);

      if (countError) {
        console.error(`❌ Erro ao contar propriedades para ${broker.business_name}:`, countError);
        continue;
      }

      console.log(`🏢 ${broker.business_name || 'Sem nome'}`);
      console.log(`   Email: ${broker.email}`);
      console.log(`   ID: ${broker.id}`);
      console.log(`   Propriedades: ${count || 0}`);
      
      if (count > 0) {
        // Listar algumas propriedades para debug
        const { data: properties, error: propsError } = await supabase
          .from('properties')
          .select('id, title, type, price, status')
          .eq('broker_id', broker.id)
          .limit(3);

        if (propsError) {
          console.error(`   ❌ Erro ao buscar detalhes das propriedades:`, propsError);
        } else {
          console.log(`   📝 Exemplos de propriedades:`);
          properties.forEach((prop, idx) => {
            console.log(`      ${idx + 1}. ${prop.title} - ${prop.type} - R$ ${prop.price?.toLocaleString('pt-BR') || 'N/A'}`);
          });
        }
      }
      console.log('');
    }

    // Verificar especificamente o danierick.erick@hotmail.com
    console.log('🔍 FOCO NO DANIERICK.ERICK@HOTMAIL.COM:\n');
    const danierick = brokers.find(b => b.email === 'danierick.erick@hotmail.com');
    
    if (danierick) {
      console.log(`✅ Imobiliária encontrada:`);
      console.log(`   Nome: ${danierick.business_name}`);
      console.log(`   ID: ${danierick.id}`);
      console.log(`   Slug: ${danierick.website_slug}`);
      
      // Buscar todas as propriedades desta imobiliária
      const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select('id, title, type, price, status, created_at')
        .eq('broker_id', danierick.id);

      if (propsError) {
        console.error(`❌ Erro ao buscar propriedades:`, propsError);
      } else {
        console.log(`   📊 Total de propriedades: ${properties.length}`);
        properties.forEach((prop, idx) => {
          console.log(`      ${idx + 1}. ${prop.title}`);
          console.log(`         Tipo: ${prop.type}`);
          console.log(`         Preço: R$ ${prop.price?.toLocaleString('pt-BR') || 'N/A'}`);
          console.log(`         Status: ${prop.status}`);
          console.log(`         Criado: ${new Date(prop.created_at).toLocaleDateString('pt-BR')}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Imobiliária danierick.erick@hotmail.com não encontrada!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verificarPropriedadesPorImobiliaria();