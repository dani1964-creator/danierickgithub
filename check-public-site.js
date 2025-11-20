#!/usr/bin/env node

/**
 * Script para verificar se os imóveis estão aparecendo no site público
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkPublicSite() {
  console.log('🔍 Verificando se imóveis aparecem no site público...\n');

  try {
    // 1. Buscar broker com domínio personalizado
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, custom_domain')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    if (brokerError) throw brokerError;

    console.log(`✅ Broker encontrado: ${broker.business_name} (${broker.website_slug})`);
    console.log(`   Domínio: ${broker.custom_domain}`);

    // 2. Testar RPC para homepage com categorias
    console.log(`\n2. Testando RPC get_homepage_categories_with_properties...`);

    const { data: homepageData, error: homepageError } = await supabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: broker.id,
        p_properties_per_category: 12
      });

    if (homepageError) {
      console.error('❌ Erro no RPC da homepage:', homepageError);
      return;
    }

    console.log(`✅ RPC homepage funcionando! Retornou ${homepageData?.length || 0} categorias:`);

    if (!homepageData || homepageData.length === 0) {
      console.log('⚠️ Nenhuma categoria com imóveis encontrada na homepage');
      
      // Verificar se existem categorias
      const { data: categories } = await supabase
        .from('property_categories')
        .select('*')
        .eq('broker_id', broker.id);

      console.log(`   Categorias totais do broker: ${categories?.length || 0}`);

      // Verificar se existem associações
      const { data: assignments } = await supabase
        .from('property_category_assignments')
        .select('*')
        .in('property_id', 
          (await supabase
            .from('properties')
            .select('id')
            .eq('broker_id', broker.id)
          ).data?.map(p => p.id) || []
        );

      console.log(`   Associações imóvel-categoria: ${assignments?.length || 0}`);

      if (categories?.length === 0) {
        console.log('❌ PROBLEMA: Não há categorias criadas para este broker');
      }
      
      if (assignments?.length === 0) {
        console.log('❌ PROBLEMA: Não há imóveis associados a categorias');
      }
    } else {
      homepageData.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (${category.properties_count} imóveis)`);
        if (category.properties && category.properties.length > 0) {
          category.properties.forEach(property => {
            console.log(`      - ${property.title} (${property.slug})`);
          });
        }
      });
    }

    // 3. Verificar imóveis ativos diretamente
    console.log(`\n3. Verificando imóveis ativos diretamente...`);

    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, slug, is_active, is_published')
      .eq('broker_id', broker.id)
      .eq('is_active', true)
      .eq('is_published', true);

    if (propertiesError) throw propertiesError;

    console.log(`✅ Imóveis ativos e publicados: ${properties?.length || 0}`);
    properties?.forEach((property, index) => {
      console.log(`   ${index + 1}. ${property.title} (${property.slug})`);
    });

    // 4. Verificar associações por imóvel
    if (properties && properties.length > 0) {
      console.log(`\n4. Verificando associações de categoria por imóvel...`);
      
      for (const property of properties) {
        const { data: assignments } = await supabase
          .from('property_category_assignments')
          .select(`
            category_id,
            property_categories (
              name,
              show_on_homepage
            )
          `)
          .eq('property_id', property.id);

        console.log(`   ${property.title}:`);
        if (assignments && assignments.length > 0) {
          assignments.forEach(assignment => {
            console.log(`     ✅ Categoria: ${assignment.property_categories?.name} (homepage: ${assignment.property_categories?.show_on_homepage})`);
          });
        } else {
          console.log(`     ❌ Sem categorias associadas`);
        }
      }
    }

    console.log(`\n🎯 DIAGNÓSTICO:`);
    if (homepageData && homepageData.length > 0) {
      console.log('✅ Os imóveis DEVEM aparecer no site público');
      console.log(`📱 Teste em: https://${broker.custom_domain} ou https://${broker.website_slug}.adminimobiliaria.site`);
    } else {
      console.log('❌ Os imóveis NÃO aparecerão no site público');
      console.log('💡 Solução: Associar imóveis a categorias ativas que aparecem na homepage');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkPublicSite();