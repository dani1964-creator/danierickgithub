const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

async function executarCorrecaoCompleta() {
  console.log('🚀 EXECUTANDO CORREÇÃO COMPLETA...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('CORRECAO-COMPLETA.sql', 'utf8');
    
    // Dividir em comandos individuais (por ponto e vírgula + quebra de linha)
    const commands = sqlContent
      .split(';\n')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('DROP FUNCTION')) {
        console.log(`${i + 1}. 🗑️  Removendo função antiga...`);
      } else if (command.includes('CREATE OR REPLACE FUNCTION get_homepage_categories')) {
        console.log(`${i + 1}. 🏠 Criando função get_homepage_categories_with_properties...`);
      } else if (command.includes('CREATE OR REPLACE FUNCTION get_property_by_slug')) {
        console.log(`${i + 1}. 🔍 Criando função get_property_by_slug...`);
      } else if (command.includes('CREATE OR REPLACE FUNCTION increment_property_views')) {
        console.log(`${i + 1}. 📊 Criando função increment_property_views...`);
      } else if (command.includes('GRANT EXECUTE')) {
        console.log(`${i + 1}. 🔐 Configurando permissões...`);
      } else {
        console.log(`${i + 1}. ⚙️  Executando comando...`);
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: command + ';' });
        
        if (error) {
          console.error(`   ❌ Erro:`, error.message);
          // Continuar mesmo com erros (algumas funções podem já existir)
        } else {
          console.log(`   ✅ Sucesso!`);
        }
      } catch (rpcError) {
        console.log(`   ⚠️  RPC exec_sql não disponível, tentando método alternativo...`);
        break;
      }
    }

    // Testar as funções criadas
    console.log('\n🧪 TESTANDO FUNÇÕES CRIADAS...\n');

    // Teste 1: get_homepage_categories_with_properties
    console.log('1️⃣ Testando get_homepage_categories_with_properties...');
    try {
      const { data: categories, error: catError } = await supabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: '1e7b21c7-1727-4741-8b89-dcddc406ce06',
          p_properties_per_category: 5
        });

      if (catError) {
        console.log('   ❌ Ainda com erro:', catError.message);
      } else {
        console.log('   ✅ Funcionando! Retornou', categories?.length || 0, 'categorias');
      }
    } catch (error) {
      console.log('   ❌ Erro ao testar:', error.message);
    }

    // Teste 2: get_property_by_slug
    console.log('\n2️⃣ Testando get_property_by_slug...');
    try {
      const { data: property, error: propError } = await supabase
        .rpc('get_property_by_slug', {
          p_property_slug: 'casa-de-frente-a-praia-b497fe1f',
          p_broker_slug: 'rfimobiliaria'
        });

      if (propError) {
        console.log('   ❌ Ainda com erro:', propError.message);
      } else {
        console.log('   ✅ Funcionando! Propriedade:', property?.property_data?.title);
      }
    } catch (error) {
      console.log('   ❌ Erro ao testar:', error.message);
    }

    console.log('\n🎯 INSTRUÇÕES FINAIS:');
    console.log('📋 Se houver erros acima, execute o SQL manualmente no Dashboard:');
    console.log('🌐 https://supabase.com/dashboard > SQL Editor');
    console.log('📁 Cole o conteúdo de CORRECAO-COMPLETA.sql');
    console.log('▶️  Execute e teste novamente');

  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    console.log('\n🔧 EXECUÇÃO MANUAL NECESSÁRIA:');
    console.log('1. Abra https://supabase.com/dashboard');
    console.log('2. Vá em SQL Editor'); 
    console.log('3. Cole o conteúdo de CORRECAO-COMPLETA.sql');
    console.log('4. Execute o script');
    console.log('5. Teste com: node teste-rfimobiliaria.js');
  }
}

executarCorrecaoCompleta();