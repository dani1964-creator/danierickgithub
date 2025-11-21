#!/usr/bin/env node

/**
 * VERIFICAÇÃO FINAL COM SERVICE ROLE KEY CORRETA
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalVerification() {
  console.log('🔍 VERIFICAÇÃO FINAL COM SERVICE ROLE...\n');
  console.log('=' .repeat(60));

  try {
    // 1. Buscar broker
    const { data: broker, error: brokerError } = await adminSupabase
      .from('brokers')
      .select('*')
      .eq('website_slug', 'rfimobiliaria')
      .single();

    if (brokerError) {
      console.log(`❌ Erro ao buscar broker: ${brokerError.message}`);
      return;
    }

    console.log(`✅ Broker: ${broker.business_name} (${broker.website_slug})`);
    console.log(`   ID: ${broker.id}`);
    console.log(`   Domínio: ${broker.custom_domain}`);

    // 2. Verificar associações atuais
    console.log('\n📊 VERIFICANDO ASSOCIAÇÕES ATUAIS...\n');

    const { data: currentAssociations, error: assocError } = await adminSupabase
      .from('property_category_assignments')
      .select(`
        *,
        properties (title, slug, is_active, is_published),
        property_categories (name, slug, is_active, show_on_homepage)
      `)
      .eq('broker_id', broker.id);

    if (assocError) {
      console.log(`❌ Erro ao verificar associações: ${assocError.message}`);
    } else {
      console.log(`📊 Associações encontradas: ${currentAssociations?.length || 0}`);
      
      if (currentAssociations && currentAssociations.length > 0) {
        console.log('\n📋 Detalhes das associações:');
        currentAssociations.forEach((assoc, index) => {
          console.log(`   ${index + 1}. ${assoc.properties?.title} → ${assoc.property_categories?.name}`);
          console.log(`      Imóvel ativo: ${assoc.properties?.is_active}, publicado: ${assoc.properties?.is_published}`);
          console.log(`      Categoria ativa: ${assoc.property_categories?.is_active}, homepage: ${assoc.property_categories?.show_on_homepage}`);
          console.log('');
        });
      } else {
        console.log('❌ NENHUMA ASSOCIAÇÃO ENCONTRADA! Vou criar agora...\n');
        await createAssociationsWithServiceRole(broker.id);
        return;
      }
    }

    // 3. Testar RPC com service role
    console.log('⚙️ TESTANDO RPC COM SERVICE ROLE...\n');

    const { data: rpcAdmin, error: rpcAdminError } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: broker.id,
        p_properties_per_category: 12
      });

    if (rpcAdminError) {
      console.log(`❌ RPC admin falhou: ${rpcAdminError.message}`);
    } else {
      console.log(`✅ RPC admin funcionou: ${rpcAdmin?.length || 0} categorias`);
      if (rpcAdmin && rpcAdmin.length > 0) {
        rpcAdmin.forEach((cat, index) => {
          const name = cat.category_name || cat.name || 'Categoria';
          const count = cat.properties_count || (cat.properties ? cat.properties.length : 0);
          console.log(`   ${index + 1}. ${name}: ${count} imóveis`);
          
          if (cat.properties && cat.properties.length > 0) {
            cat.properties.slice(0, 3).forEach((prop) => {
              console.log(`      - ${prop.title || prop.property_title}`);
            });
            if (cat.properties.length > 3) {
              console.log(`      ... e mais ${cat.properties.length - 3} imóveis`);
            }
          }
        });
      }
    }

    // 4. Testar RPC com anon (como o frontend faz)
    console.log('\n👤 TESTANDO RPC COM ANON (como frontend)...\n');

    const { data: rpcPublic, error: rpcPublicError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: broker.id,
        p_properties_per_category: 12
      });

    if (rpcPublicError) {
      console.log(`❌ RPC público falhou: ${rpcPublicError.message}`);
    } else {
      console.log(`✅ RPC público funcionou: ${rpcPublic?.length || 0} categorias`);
    }

    // 5. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO FINAL...\n');

    if (currentAssociations && currentAssociations.length > 0) {
      if (rpcAdmin && rpcAdmin.length > 0 && rpcPublic && rpcPublic.length > 0) {
        const totalProperties = rpcAdmin.reduce((total, cat) => {
          return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
        }, 0);

        console.log('🎉 TUDO FUNCIONANDO PERFEITAMENTE! 🎉');
        console.log(`✅ ${currentAssociations.length} associações criadas`);
        console.log(`✅ ${totalProperties} imóveis disponíveis nas categorias`);
        console.log(`✅ RPC funcionando tanto com service role quanto anon`);
        console.log('\n📱 O SITE PÚBLICO DEVE ESTAR FUNCIONANDO:');
        console.log(`   🌐 https://${broker.custom_domain}`);
        console.log(`   🌐 https://${broker.website_slug}.adminimobiliaria.site`);
      } else {
        console.log('⚠️ Associações existem mas RPC pode ter problemas');
      }
    } else {
      console.log('❌ Ainda há problemas com as associações');
    }

  } catch (error) {
    console.error('💥 Erro na verificação final:', error.message);
  }
}

async function createAssociationsWithServiceRole(brokerId) {
  console.log('🔧 CRIANDO ASSOCIAÇÕES COM SERVICE ROLE...\n');

  try {
    // Buscar dados necessários
    const { data: properties } = await adminSupabase
      .from('properties')
      .select('id, title, is_featured')
      .eq('broker_id', brokerId)
      .eq('is_active', true)
      .eq('is_published', true);

    const { data: categories } = await adminSupabase
      .from('property_categories')
      .select('id, name, slug')
      .eq('broker_id', brokerId)
      .eq('is_active', true);

    if (!properties || !categories || properties.length === 0 || categories.length === 0) {
      console.log('❌ Dados insuficientes para criar associações');
      return;
    }

    console.log(`📊 Encontrados ${properties.length} imóveis e ${categories.length} categorias`);

    const destaqueCategory = categories.find(c => c.slug === 'destaque');
    const todosCategory = categories.find(c => c.slug === 'todos');

    // Limpar associações existentes
    await adminSupabase
      .from('property_category_assignments')
      .delete()
      .eq('broker_id', brokerId);

    const associations = [];

    // Criar associações
    for (const property of properties) {
      // Todos vão para "Todos os Imóveis"
      if (todosCategory) {
        associations.push({
          property_id: property.id,
          category_id: todosCategory.id,
          broker_id: brokerId
        });
      }

      // Em destaque também vão para categoria destaque
      if (property.is_featured && destaqueCategory) {
        associations.push({
          property_id: property.id,
          category_id: destaqueCategory.id,
          broker_id: brokerId
        });
      }
    }

    console.log(`🔄 Criando ${associations.length} associações...`);

    const { data: created, error: createError } = await adminSupabase
      .from('property_category_assignments')
      .insert(associations)
      .select();

    if (createError) {
      console.log(`❌ Erro ao criar associações: ${createError.message}`);
    } else {
      console.log(`✅ ${created?.length || 0} associações criadas com sucesso!`);
      
      // Verificar resultado
      await finalVerification();
    }

  } catch (error) {
    console.error('💥 Erro ao criar associações:', error.message);
  }
}

finalVerification();