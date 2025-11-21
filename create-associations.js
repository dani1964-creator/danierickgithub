#!/usr/bin/env node

/**
 * SCRIPT PARA CRIAR ASSOCIAÇÕES IMÓVEL-CATEGORIA
 * Este é o problema: existem imóveis e categorias mas sem associações!
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAssociations() {
  console.log('🔧 CRIANDO ASSOCIAÇÕES IMÓVEL-CATEGORIA...\n');

  try {
    // 1. Buscar dados
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, is_featured')
      .eq('broker_id', broker.id)
      .eq('is_active', true)
      .eq('is_published', true);

    const { data: categories } = await supabase
      .from('property_categories')
      .select('id, name, slug')
      .eq('broker_id', broker.id)
      .eq('is_active', true);

    console.log(`✅ Broker: ${broker.id}`);
    console.log(`✅ Imóveis: ${properties?.length || 0}`);
    console.log(`✅ Categorias: ${categories?.length || 0}`);

    if (!properties || !categories || properties.length === 0 || categories.length === 0) {
      console.log('❌ Dados insuficientes para criar associações');
      return;
    }

    // 2. Definir associações
    const destaqueCategory = categories.find(c => c.slug === 'destaque');
    const todosCategory = categories.find(c => c.slug === 'todos');

    const associations = [];

    // Todos os imóveis vão para "Todos os Imóveis"
    if (todosCategory) {
      for (const property of properties) {
        associations.push({
          property_id: property.id,
          category_id: todosCategory.id,
          broker_id: broker.id
        });
        console.log(`📌 ${property.title} → ${todosCategory.name}`);
      }
    }

    // Imóveis em destaque também vão para "Imóveis em Destaque"
    if (destaqueCategory) {
      for (const property of properties.filter(p => p.is_featured)) {
        associations.push({
          property_id: property.id,
          category_id: destaqueCategory.id,
          broker_id: broker.id
        });
        console.log(`⭐ ${property.title} → ${destaqueCategory.name} (destaque)`);
      }
    }

    console.log(`\n🔄 Criando ${associations.length} associações...\n`);

    // 3. Tentar criar associações (uma por vez para debug)
    let sucessCount = 0;
    let errorCount = 0;

    for (const assoc of associations) {
      try {
        const { data, error } = await supabase
          .from('property_category_assignments')
          .insert(assoc)
          .select();

        if (error) {
          console.log(`❌ Erro: ${error.message}`);
          console.log(`   Tentativa: ${JSON.stringify(assoc)}`);
          errorCount++;
        } else {
          console.log(`✅ Criada: ${assoc.property_id} → ${assoc.category_id}`);
          sucessCount++;
        }
      } catch (err) {
        console.log(`💥 Exceção: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Sucessos: ${sucessCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);

    if (sucessCount > 0) {
      // 4. Verificar resultado
      console.log(`\n🔍 Verificando resultado...\n`);

      const { data: newAssociations } = await supabase
        .from('property_category_assignments')
        .select(`
          *,
          properties (title),
          property_categories (name)
        `)
        .eq('broker_id', broker.id);

      console.log(`📊 Total de associações agora: ${newAssociations?.length || 0}`);

      if (newAssociations && newAssociations.length > 0) {
        newAssociations.forEach((assoc, index) => {
          console.log(`   ${index + 1}. ${assoc.properties?.title} → ${assoc.property_categories?.name}`);
        });
      }

      // 5. Testar RPC novamente
      console.log(`\n⚙️ Testando RPC após criação...\n`);

      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: broker.id,
          p_properties_per_category: 12
        });

      if (rpcError) {
        console.log(`❌ RPC ainda com erro: ${rpcError.message}`);
      } else {
        console.log(`✅ RPC funcionando: ${rpcResult?.length || 0} categorias`);
        if (rpcResult && rpcResult.length > 0) {
          rpcResult.forEach((cat, index) => {
            const name = cat.category_name || cat.name || 'Nome indefinido';
            const count = cat.properties_count || 0;
            console.log(`   ${index + 1}. ${name}: ${count} imóveis`);
          });
        }
      }

      console.log('\n🎉 SUCESSO! Associações criadas!');
      console.log('\n📱 Agora teste o site público:');
      console.log('   https://imobideps.com');
      console.log('   https://rfimobiliaria.adminimobiliaria.site');
    } else {
      console.log('\n❌ FALHA: Nenhuma associação foi criada');
      console.log('💡 Pode ser problema de permissão ou estrutura da tabela');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

createAssociations();