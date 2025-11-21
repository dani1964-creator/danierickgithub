#!/usr/bin/env node

/**
 * DEBUG ESPECÍFICO DA FUNÇÃO RPC
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugRPC() {
  console.log('🔍 DEBUG ESPECÍFICO DA FUNÇÃO RPC\n');
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  // 1. Testar consultas manuais para reproduzir a lógica da RPC
  console.log('📋 TESTANDO CONSULTAS MANUAIS...\n');

  // Buscar categorias
  const { data: categories, error: catError } = await adminSupabase
    .from('property_categories')
    .select('*')
    .eq('broker_id', brokerId)
    .eq('is_active', true)
    .eq('show_on_homepage', true)
    .order('name');

  console.log('📂 Categorias encontradas:');
  if (catError) {
    console.log(`❌ Erro: ${catError.message}`);
  } else {
    console.log(`✅ ${categories?.length || 0} categorias`);
    categories?.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug}) - ID: ${cat.id}`);
    });
  }

  // Para cada categoria, buscar imóveis
  if (categories && categories.length > 0) {
    console.log('\n🏠 BUSCANDO IMÓVEIS POR CATEGORIA...\n');
    
    for (const category of categories) {
      console.log(`📁 Categoria: ${category.name}`);
      
      // Buscar associações
      const { data: associations, error: assocError } = await adminSupabase
        .from('property_category_assignments')
        .select(`
          property_id,
          properties (
            id, title, slug, price, location, property_type, transaction_type,
            bedrooms, bathrooms, area, is_featured, is_active, is_published,
            created_at, images
          )
        `)
        .eq('category_id', category.id)
        .eq('broker_id', brokerId);

      if (assocError) {
        console.log(`   ❌ Erro nas associações: ${assocError.message}`);
      } else {
        console.log(`   📊 Associações encontradas: ${associations?.length || 0}`);
        
        if (associations && associations.length > 0) {
          associations.forEach(assoc => {
            const prop = assoc.properties;
            if (prop) {
              console.log(`   🏡 ${prop.title} - Ativo: ${prop.is_active}, Publicado: ${prop.is_published}`);
            } else {
              console.log(`   ⚠️ Associação sem propriedade: ${assoc.property_id}`);
            }
          });
          
          // Filtrar apenas ativos e publicados
          const activeProperties = associations.filter(assoc => 
            assoc.properties && 
            assoc.properties.is_active && 
            assoc.properties.is_published
          );
          console.log(`   ✅ Imóveis ativos/publicados: ${activeProperties.length}`);
        }
      }
      console.log('');
    }
  }

  // 2. Reproduzir exatamente a lógica da RPC
  console.log('⚙️ REPRODUZINDO LÓGICA DA RPC...\n');

  try {
    const result = [];
    
    if (categories && categories.length > 0) {
      for (const category of categories) {
        // Query que deveria estar na RPC
        const { data: categoryProperties, error: propError } = await adminSupabase
          .from('property_category_assignments')
          .select(`
            properties!inner (
              id, title, slug, price, location, property_type, transaction_type,
              bedrooms, bathrooms, area, is_featured, created_at, images
            )
          `)
          .eq('category_id', category.id)
          .eq('broker_id', brokerId)
          .eq('properties.is_active', true)
          .eq('properties.is_published', true)
          .order('properties.created_at', { ascending: false })
          .limit(12);

        if (propError) {
          console.log(`❌ Erro ao buscar imóveis para ${category.name}: ${propError.message}`);
        } else {
          const properties = categoryProperties?.map(item => item.properties) || [];
          console.log(`📊 ${category.name}: ${properties.length} imóveis encontrados`);
          
          result.push({
            category_id: category.id,
            category_name: category.name,
            category_slug: category.slug,
            properties_count: properties.length,
            properties: properties
          });
        }
      }
    }

    console.log('\n🎯 RESULTADO FINAL DA SIMULAÇÃO:');
    result.forEach(cat => {
      console.log(`   ${cat.category_name}: ${cat.properties_count} imóveis`);
    });

  } catch (err) {
    console.log(`💥 Erro na simulação: ${err.message}`);
  }

  // 3. Verificar se a RPC existe mesmo
  console.log('\n🔍 VERIFICANDO SE A RPC EXISTE...\n');

  try {
    const { data: rpcResult, error: rpcError } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 12
      });

    if (rpcError) {
      console.log(`❌ RPC com service role falhou: ${rpcError.message}`);
    } else {
      console.log(`✅ RPC com service role funcionou: ${rpcResult?.length || 0} categorias`);
      rpcResult?.forEach(cat => {
        const name = cat.category_name || cat.name || 'Categoria sem nome';
        const count = cat.properties_count || (cat.properties ? cat.properties.length : 0);
        console.log(`   ${name}: ${count} imóveis`);
        
        if (cat.properties && cat.properties.length > 0) {
          console.log(`      Primeiro imóvel: ${cat.properties[0].title || cat.properties[0].property_title}`);
        }
      });
    }
  } catch (err) {
    console.log(`💥 Exceção na RPC: ${err.message}`);
  }
}

debugRPC().catch(console.error);