#!/usr/bin/env node

/**
 * SCRIPT PARA VERIFICAR SE AS ASSOCIAÇÕES FORAM CRIADAS
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyAssociations() {
  console.log('🔍 VERIFICANDO SE AS ASSOCIAÇÕES FORAM CRIADAS...\n');

  try {
    // Buscar broker
    const { data: broker } = await supabase
      .from('brokers')
      .select('id, business_name')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    console.log(`✅ Broker: ${broker.business_name} (${broker.id})`);

    // Verificar associações
    const { data: associations, error: associationsError } = await supabase
      .from('property_category_assignments')
      .select(`
        *,
        properties (title, slug),
        property_categories (name, slug)
      `)
      .eq('broker_id', broker.id);

    if (associationsError) {
      console.log(`❌ Erro ao buscar associações: ${associationsError.message}`);
      return;
    }

    console.log(`\n📊 ASSOCIAÇÕES ENCONTRADAS: ${associations?.length || 0}\n`);

    if (associations && associations.length > 0) {
      associations.forEach((assoc, index) => {
        console.log(`   ${index + 1}. ${assoc.properties?.title} → ${assoc.property_categories?.name}`);
      });

      // Testar RPC da homepage
      console.log('\n⚙️ TESTANDO RPC DA HOMEPAGE...\n');
      
      const { data: homepage, error: homepageError } = await supabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: broker.id,
          p_properties_per_category: 12
        });

      if (homepageError) {
        console.log(`❌ RPC homepage falhou: ${homepageError.message}`);
      } else {
        console.log(`✅ RPC homepage funcionou: ${homepage?.length || 0} categorias\n`);
        
        if (homepage && homepage.length > 0) {
          homepage.forEach((cat, index) => {
            const name = cat.category_name || cat.name || 'Nome indefinido';
            const count = cat.properties_count || (cat.properties ? cat.properties.length : 0);
            console.log(`   ${index + 1}. ${name}: ${count} imóveis`);
            
            if (cat.properties && cat.properties.length > 0) {
              cat.properties.forEach((prop, propIndex) => {
                console.log(`      - ${prop.title || prop.property_title} (${prop.slug})`);
              });
            }
          });

          console.log('\n🎉 SUCESSO TOTAL! Os imóveis agora aparecem no site público! 🎉');
          console.log('\n📱 TESTE AGORA:');
          console.log('   🌐 https://imobideps.com');
          console.log('   🌐 https://rfimobiliaria.adminimobiliaria.site');
          console.log('\n💡 Os imóveis devem aparecer organizados em categorias na homepage!');
          
        } else {
          console.log('⚠️ RPC funcionou mas não retornou dados. Pode haver outro problema.');
        }
      }
    } else {
      console.log('❌ NENHUMA ASSOCIAÇÃO ENCONTRADA');
      console.log('💡 Execute o SQL no dashboard do Supabase primeiro!');
      console.log('📋 Link: https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql');
    }

  } catch (error) {
    console.error('💥 Erro na verificação:', error.message);
  }
}

verifyAssociations();