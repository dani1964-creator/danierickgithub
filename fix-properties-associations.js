#!/usr/bin/env node

/**
 * Script para recriar associações entre imóveis e categorias
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixPropertiesAssociations() {
  console.log('🔧 Recriando associações entre imóveis e categorias...\n');

  try {
    // 1. Buscar o broker rfimobiliaria
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    if (brokerError) throw brokerError;

    console.log(`✅ Broker encontrado: ${broker.business_name} (${broker.website_slug})`);

    // 2. Verificar/criar categorias padrão
    console.log('\n2. Verificando categorias...');
    
    const { data: existingCategories } = await supabase
      .from('property_categories')
      .select('*')
      .eq('broker_id', broker.id);

    console.log(`   Categorias existentes: ${existingCategories?.length || 0}`);

    let categories = existingCategories || [];

    // Criar categorias padrão se não existirem
    if (categories.length === 0) {
      console.log('   Criando categorias padrão...');
      
      const defaultCategories = [
        {
          name: 'Imóveis em Destaque',
          slug: 'imoveis-em-destaque',
          description: 'Imóveis selecionados em destaque',
          color: '#2563eb',
          icon: 'Star',
          is_active: true,
          show_on_homepage: true,
          display_order: 0
        },
        {
          name: 'Todos os Imóveis',
          slug: 'todos-os-imoveis',
          description: 'Todos os imóveis disponíveis',
          color: '#16a34a',
          icon: 'Home',
          is_active: true,
          show_on_homepage: true,
          display_order: 1
        }
      ];

      for (const category of defaultCategories) {
        const { data: createdCategory, error: categoryError } = await supabase
          .from('property_categories')
          .insert({
            broker_id: broker.id,
            ...category
          })
          .select()
          .single();

        if (categoryError) {
          console.error(`   ❌ Erro ao criar categoria ${category.name}:`, categoryError);
        } else {
          console.log(`   ✅ Categoria criada: ${category.name}`);
          categories.push(createdCategory);
        }
      }
    } else {
      categories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.slug})`);
      });
    }

    // 3. Buscar imóveis ativos
    console.log('\n3. Buscando imóveis ativos...');
    
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, slug, is_featured')
      .eq('broker_id', broker.id)
      .eq('is_active', true)
      .eq('is_published', true);

    if (propertiesError) throw propertiesError;

    console.log(`✅ Imóveis encontrados: ${properties?.length || 0}`);
    properties?.forEach((property, index) => {
      console.log(`   ${index + 1}. ${property.title} (destaque: ${property.is_featured})`);
    });

    if (!properties || properties.length === 0) {
      console.log('❌ Nenhum imóvel ativo encontrado');
      return;
    }

    // 4. Remover associações existentes
    console.log('\n4. Removendo associações antigas...');
    
    const propertyIds = properties.map(p => p.id);
    const { error: deleteError } = await supabase
      .from('property_category_assignments')
      .delete()
      .in('property_id', propertyIds);

    if (deleteError) {
      console.log('   ⚠️ Erro ao remover associações antigas:', deleteError);
    } else {
      console.log('   ✅ Associações antigas removidas');
    }

    // 5. Criar novas associações
    console.log('\n5. Criando novas associações...');
    
    const destaqueCategory = categories.find(c => c.slug === 'imoveis-em-destaque');
    const todosCategory = categories.find(c => c.slug === 'todos-os-imoveis');

    const newAssignments = [];
    
    for (const property of properties) {
      // Todos os imóveis vão para "Todos os Imóveis"
      if (todosCategory) {
        newAssignments.push({
          property_id: property.id,
          category_id: todosCategory.id
        });
      }

      // Imóveis em destaque também vão para "Imóveis em Destaque"
      if (property.is_featured && destaqueCategory) {
        newAssignments.push({
          property_id: property.id,
          category_id: destaqueCategory.id
        });
      }
    }

    console.log(`   Criando ${newAssignments.length} associações...`);

    const { data: createdAssignments, error: assignmentsError } = await supabase
      .from('property_category_assignments')
      .insert(newAssignments)
      .select();

    if (assignmentsError) throw assignmentsError;

    console.log(`   ✅ ${createdAssignments?.length || 0} associações criadas`);

    // 6. Verificar resultado
    console.log('\n6. Verificando resultado...');
    
    for (const category of categories) {
      const { data: categoryAssignments } = await supabase
        .from('property_category_assignments')
        .select('property_id')
        .eq('category_id', category.id);

      console.log(`   ${category.name}: ${categoryAssignments?.length || 0} imóveis`);
    }

    console.log('\n🎉 Associações recriadas com sucesso!');
    console.log('\n📝 Agora teste o site público em:');
    console.log(`   https://imobideps.com`);
    console.log(`   https://rfimobiliaria.adminimobiliaria.site`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixPropertiesAssociations();