// TESTE COMPLETO: RPC + DETALHES + CATEGORIAS
// Execute: node teste-correcoes-finais.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.93BoB8HRCtPqJ6UJx8y9bD_Hhz-V_2ksf9DJgwJy_2o";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testeCompleto() {
  console.log('\n🧪 TESTE COMPLETO: RPC + DETALHES + CATEGORIAS\n');

  try {
    // 1. USAR BROKER CONHECIDO (danierick)
    console.log('1️⃣ Usando broker conhecido: danierick...');
    
    // Simular dados do broker danierick
    const broker = {
      id: '00000000-0000-0000-0000-000000000001', // ID fictício
      website_slug: 'danierick',
      business_name: 'Danierick Imóveis'
    };
    
    console.log(`✅ Broker: ${broker.business_name} (${broker.website_slug})`);

    console.log(`✅ Broker: ${broker.business_name} (${broker.website_slug})`);

    // 2. BUSCAR PROPRIEDADE CONHECIDA
    console.log('\n2️⃣ Buscando propriedades conhecidas...');
    
    // Usar os slugs conhecidos do diagnóstico anterior
    const knownSlugs = [
      'casa-de-frente-a-praia-b497fe1f',
      'casa-teste-venda', 
      'casa-bela-vista-651438be'
    ];
    
    console.log('Slugs conhecidos para teste:', knownSlugs);
    
    // Testar com primeiro slug conhecido
    const property = {
      id: 'test-id',
      title: 'Casa De frente a Praia',
      slug: knownSlugs[0],
      broker_id: broker.id
    };
    
    console.log(`✅ Usando propriedade: ${property.title} (slug: ${property.slug})`);

    // 3. TESTE RPC get_homepage_categories_with_properties
    console.log('\n3️⃣ Testando RPC get_homepage_categories_with_properties...');
    try {
      const { data: categories, error: catError } = await supabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: broker.id,
          p_properties_per_category: 5
        });

      if (catError) {
        console.log('❌ ERRO RPC categorias:', catError.message);
      } else {
        console.log(`✅ RPC categorias OK! ${categories?.length || 0} categorias retornadas`);
        if (categories && categories.length > 0) {
          categories.forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.category_name} (${cat.properties_count} imóveis) - Ordem: ${cat.category_display_order}`);
          });
        }
      }
    } catch (rpcError) {
      console.log('❌ ERRO CRÍTICO RPC categorias:', rpcError.message);
    }

    // 4. TESTE RPC get_property_by_slug
    console.log('\n4️⃣ Testando RPC get_property_by_slug...');
    try {
      const { data: propertyDetail, error: propError } = await supabase
        .rpc('get_property_by_slug', {
          p_property_slug: property.slug,
          p_broker_slug: broker.website_slug
        })
        .single();

      if (propError) {
        console.log('❌ ERRO RPC propriedade:', propError.message);
      } else if (!propertyDetail) {
        console.log('❌ RPC propriedade retornou null');
      } else {
        console.log(`✅ RPC propriedade OK!`);
        console.log(`   - ID: ${propertyDetail.property_id}`);
        console.log(`   - Título: ${propertyDetail.property_data?.title}`);
        console.log(`   - Broker: ${propertyDetail.broker_data?.business_name}`);
      }
    } catch (propError) {
      console.log('❌ ERRO CRÍTICO RPC propriedade:', propError.message);
    }

    // 5. TESTE increment_property_views
    console.log('\n5️⃣ Testando increment_property_views...');
    try {
      const { error: viewError } = await supabase
        .rpc('increment_property_views', {
          p_property_id: property.id
        });

      if (viewError) {
        console.log('❌ ERRO incrementar views:', viewError.message);
      } else {
        console.log('✅ Incrementar views OK!');
      }
    } catch (viewError) {
      console.log('❌ ERRO CRÍTICO incrementar views:', viewError.message);
    }

    // 6. VERIFICAR ESTRUTURA CATEGORIA
    console.log('\n6️⃣ Verificando estrutura de categorias...');
    const { data: categoryTest } = await supabase
      .from('property_categories')
      .select('id, name, display_order, color, icon, show_on_homepage')
      .eq('broker_id', broker.id)
      .limit(1)
      .single();

    if (categoryTest) {
      console.log('✅ Estrutura categorias OK!');
      console.log(`   - display_order: ${categoryTest.display_order !== undefined ? '✅' : '❌'}`);
      console.log(`   - color: ${categoryTest.color !== undefined ? '✅' : '❌'}`);
      console.log(`   - icon: ${categoryTest.icon !== undefined ? '✅' : '❌'}`);
      console.log(`   - show_on_homepage: ${categoryTest.show_on_homepage !== undefined ? '✅' : '❌'}`);
    } else {
      console.log('❌ Nenhuma categoria encontrada');
    }

    console.log('\n🎯 RESUMO:');
    console.log('  - Execute CORRECAO-COMPLETA.sql no dashboard');
    console.log('  - Teste as URLs de propriedades');
    console.log('  - Verifique se categorias aparecem no site público');
    console.log('  - Teste criação de novas categorias');

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

testeCompleto();