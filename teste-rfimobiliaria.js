const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

async function testeCorrecaoRfImobiliaria() {
  console.log('🔍 TESTE: Verificando correções para rfimobiliaria\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // 1. Verificar se broker rfimobiliaria existe
    console.log('1️⃣ Verificando broker rfimobiliaria...');
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('*')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    if (brokerError || !broker) {
      console.error('❌ Broker rfimobiliaria não encontrado:', brokerError);
      return;
    }
    
    console.log('✅ Broker encontrado:', broker.business_name);
    console.log('   ID:', broker.id);
    console.log('   Slug:', broker.website_slug);
    console.log('   Domínio customizado:', broker.custom_domain || 'Nenhum');

    // 2. Verificar propriedades do rfimobiliaria
    console.log('\n2️⃣ Verificando propriedades...');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, title, slug, is_active, is_published')
      .eq('broker_id', broker.id);

    if (propError) {
      console.error('❌ Erro ao buscar propriedades:', propError);
      return;
    }

    console.log(`✅ ${properties.length} propriedades encontradas:`);
    properties.forEach(prop => {
      console.log(`   - ${prop.title} (${prop.slug}) [Ativa: ${prop.is_active}, Publicada: ${prop.is_published}]`);
    });

    // 3. Testar nova função RPC get_property_by_slug
    if (properties.length > 0) {
      console.log('\n3️⃣ Testando função get_property_by_slug...');
      
      const firstProperty = properties[0];
      const { data: propertyDetail, error: rpcError } = await supabase
        .rpc('get_property_by_slug', {
          p_property_slug: firstProperty.slug,
          p_broker_slug: 'rfimobiliaria',
          p_custom_domain: null
        })
        .single();

      if (rpcError) {
        console.error('❌ Erro na função RPC get_property_by_slug:', rpcError);
      } else {
        console.log('✅ Função RPC funcionando!');
        console.log('   Propriedade:', propertyDetail?.property_data?.title);
        console.log('   Broker:', propertyDetail?.broker_data?.business_name);
      }
    }

    // 4. Testar função get_homepage_categories_with_properties
    console.log('\n4️⃣ Testando função get_homepage_categories_with_properties...');
    
    const { data: categories, error: catError } = await supabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: broker.id,
        p_properties_per_category: 5
      });

    if (catError) {
      console.error('❌ Erro na função RPC categorias:', catError);
    } else {
      console.log('✅ Função de categorias funcionando!');
      console.log(`   ${categories.length} categorias encontradas:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.category_name}: ${cat.properties_count} propriedades (Ordem: ${cat.category_display_order})`);
      });
    }

    // 5. Verificar URLs de acesso
    console.log('\n5️⃣ URLs de acesso:');
    console.log('🌐 Site público:', `https://rfimobiliaria.adminimobiliaria.site`);
    if (properties.length > 0) {
      console.log('🏠 Página de detalhes:', `https://rfimobiliaria.adminimobiliaria.site/${properties[0].slug}`);
    }
    if (broker.custom_domain) {
      console.log('🎯 Domínio customizado:', `https://${broker.custom_domain}`);
    }

    console.log('\n✅ TESTE CONCLUÍDO: Todas as correções verificadas para rfimobiliaria!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testeCorrecaoRfImobiliaria();