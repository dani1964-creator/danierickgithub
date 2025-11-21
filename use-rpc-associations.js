#!/usr/bin/env node

/**
 * SCRIPT PARA USAR RPC FUNCTION PARA CRIAR ASSOCIAÇÕES
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function useRPCToCreateAssociations() {
  console.log('🛠️ USANDO RPC PARA CRIAR ASSOCIAÇÕES...\n');

  try {
    // Buscar broker ID
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    if (!broker) {
      console.log('❌ Broker não encontrado');
      return;
    }

    console.log(`✅ Broker ID: ${broker.id}`);

    // Tentar usar a RPC function
    console.log('\n🔧 Executando RPC create_property_category_associations...\n');

    const { data, error } = await supabase
      .rpc('create_property_category_associations', {
        p_broker_id: broker.id
      });

    if (error) {
      console.log(`❌ RPC falhou: ${error.message}`);
      console.log(`   Código: ${error.code}`);
      console.log(`   Detalhes: ${error.details || 'N/A'}`);

      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('\n💡 A função RPC não existe. Vou tentar uma abordagem alternativa...\n');
        await alternativeApproach(broker.id);
      } else {
        console.log('\n💡 Erro na RPC. Vou tentar uma abordagem alternativa...\n');
        await alternativeApproach(broker.id);
      }
    } else {
      console.log(`✅ RPC funcionou:`, data);
      
      if (data && data.length > 0) {
        const result = data[0];
        console.log(`📊 Associações criadas: ${result.associations_created}`);
        console.log(`📝 Mensagem: ${result.message}`);
      }

      // Verificar resultado
      await checkResult(broker.id);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

async function alternativeApproach(brokerId) {
  console.log('🎯 ABORDAGEM ALTERNATIVA: Inserção manual via interface...\n');
  
  // Buscar dados para montagem manual
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, is_featured')
    .eq('broker_id', brokerId)
    .eq('is_active', true)
    .eq('is_published', true);

  const { data: categories } = await supabase
    .from('property_categories')
    .select('id, name, slug')
    .eq('broker_id', brokerId);

  console.log('📋 DADOS PARA INSERÇÃO MANUAL NO SUPABASE:\n');
  
  if (properties && categories) {
    const destaqueCategory = categories.find(c => c.slug === 'destaque');
    const todosCategory = categories.find(c => c.slug === 'todos');

    console.log('🔄 SQL PARA EXECUTAR NO SUPABASE:\n');
    console.log('```sql');
    console.log('-- Limpar associações existentes');
    console.log(`DELETE FROM property_category_assignments WHERE broker_id = '${brokerId}';`);
    console.log('');
    console.log('-- Inserir novas associações');

    for (const property of properties) {
      // Todos vão para "Todos os Imóveis"
      if (todosCategory) {
        console.log(`INSERT INTO property_category_assignments (property_id, category_id, broker_id) VALUES ('${property.id}', '${todosCategory.id}', '${brokerId}'); -- ${property.title} → ${todosCategory.name}`);
      }

      // Em destaque vão também para categoria destaque
      if (property.is_featured && destaqueCategory) {
        console.log(`INSERT INTO property_category_assignments (property_id, category_id, broker_id) VALUES ('${property.id}', '${destaqueCategory.id}', '${brokerId}'); -- ${property.title} → ${destaqueCategory.name}`);
      }
    }
    
    console.log('```');
    console.log('\n📝 INSTRUÇÕES:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql');
    console.log('2. Cole o SQL acima');
    console.log('3. Execute o script');
    console.log('4. Volte aqui e execute o script de verificação');
  }
}

async function checkResult(brokerId) {
  console.log('\n🔍 VERIFICANDO RESULTADO...\n');

  // Verificar associações criadas
  const { data: associations } = await supabase
    .from('property_category_assignments')
    .select(`
      *,
      properties (title),
      property_categories (name)
    `)
    .eq('broker_id', brokerId);

  console.log(`📊 Associações encontradas: ${associations?.length || 0}`);
  
  if (associations && associations.length > 0) {
    associations.forEach((assoc, index) => {
      console.log(`   ${index + 1}. ${assoc.properties?.title} → ${assoc.property_categories?.name}`);
    });

    // Testar RPC da homepage
    console.log('\n⚙️ Testando RPC da homepage...\n');
    
    const { data: homepage, error: homepageError } = await supabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 12
      });

    if (homepageError) {
      console.log(`❌ RPC homepage falhou: ${homepageError.message}`);
    } else {
      console.log(`✅ RPC homepage funcionou: ${homepage?.length || 0} categorias`);
      if (homepage && homepage.length > 0) {
        homepage.forEach((cat, index) => {
          const name = cat.category_name || cat.name || 'Nome indefinido';
          const count = cat.properties_count || 0;
          console.log(`   ${index + 1}. ${name}: ${count} imóveis`);
        });

        console.log('\n🎉 SUCESSO! Os imóveis agora devem aparecer no site público!');
        console.log('\n📱 Teste em:');
        console.log('   https://imobideps.com');
        console.log('   https://rfimobiliaria.adminimobiliaria.site');
      }
    }
  }
}

useRPCToCreateAssociations();