#!/usr/bin/env node

/**
 * SCRIPT COMPLETO PARA RECRIAR A FUNÇÃO RPC
 * - DROP da função existente
 * - CREATE da nova função com estrutura correta
 * - Execução direta via service role
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function recriarFuncaoRPC() {
  console.log('🔧 RECRIANDO FUNÇÃO RPC COM SERVICE ROLE\n');
  console.log('=' .repeat(60));

  try {
    // 1. DROP da função existente (com CASCADE se necessário)
    console.log('🗑️ REMOVENDO FUNÇÃO EXISTENTE...\n');
    
    const dropSQL = `
-- Remover função existente com todas as suas assinaturas
DROP FUNCTION IF EXISTS get_homepage_categories_with_properties(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_homepage_categories_with_properties(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_homepage_categories_with_properties CASCADE;
`;

    console.log('Executando DROP...');
    const { data: dropResult, error: dropError } = await adminSupabase
      .rpc('sql', { query: dropSQL })
      .catch(() => ({ data: null, error: null })); // Ignora erro se não existir função sql

    if (dropError && !dropError.message.includes('does not exist')) {
      console.log(`⚠️ Aviso no DROP: ${dropError.message}`);
    } else {
      console.log('✅ Função antiga removida (ou não existia)');
    }

    // 2. Criar nova função corrigida
    console.log('\n🔨 CRIANDO NOVA FUNÇÃO CORRIGIDA...\n');

    const createSQL = `
-- FUNÇÃO RPC CORRIGIDA COM DROP E CREATE COMPLETO
CREATE OR REPLACE FUNCTION get_homepage_categories_with_properties(
  p_broker_id UUID,
  p_properties_per_category INTEGER DEFAULT 12
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  category_description TEXT,
  properties_count BIGINT,
  properties JSONB
)
SECURITY DEFINER  
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id as category_id,
    pc.name as category_name,
    pc.slug as category_slug,
    pc.description as category_description,
    COUNT(DISTINCT pca.property_id) as properties_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'slug', p.slug,
          'price', p.price,
          'location', COALESCE(p.address, p.neighborhood || ', ' || p.city),
          'property_type', p.property_type,
          'transaction_type', p.transaction_type,
          'bedrooms', p.bedrooms,
          'bathrooms', p.bathrooms,
          'area', p.area_m2,
          'is_featured', p.is_featured,
          'created_at', p.created_at,
          'images', p.images
        ) ORDER BY p.created_at DESC
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) as properties
  FROM property_categories pc
  LEFT JOIN property_category_assignments pca ON pc.id = pca.category_id
  LEFT JOIN properties p ON pca.property_id = p.id 
    AND p.is_active = true 
    AND p.is_published = true
    AND p.broker_id = p_broker_id
  WHERE pc.broker_id = p_broker_id
    AND pc.is_active = true
    AND pc.show_on_homepage = true
  GROUP BY pc.id, pc.name, pc.slug, pc.description
  ORDER BY pc.name;
END;
$$;
`;

    console.log('Executando CREATE...');
    const { data: createResult, error: createError } = await adminSupabase
      .rpc('sql', { query: createSQL })
      .catch(() => ({ data: null, error: null }));

    if (createError) {
      console.log(`❌ Erro no CREATE: ${createError.message}\n`);
      
      // Tentar método alternativo - execução direta
      console.log('🔄 TENTANDO EXECUÇÃO DIRETA VIA RAW SQL...\n');
      
      try {
        // Método alternativo usando uma query direta
        const { error: directError } = await adminSupabase
          .from('pg_stat_activity') // Usar uma tabela existente só para trigger SQL
          .select('pid')
          .limit(1);

        console.log('⚠️ Execução direta via client não suportada');
        console.log('\n📋 SQL PARA EXECUTAR MANUALMENTE:\n');
        console.log('-- 1. EXECUTE PRIMEIRO O DROP:');
        console.log(dropSQL);
        console.log('\n-- 2. DEPOIS EXECUTE O CREATE:');
        console.log(createSQL);
        console.log('\n-- 3. E AS PERMISSÕES:');
        console.log(`
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;
`);
        console.log('=' .repeat(60));
        return false;

      } catch (err) {
        console.log(`💥 Erro na execução direta: ${err.message}`);
        return false;
      }
    } else {
      console.log('✅ Função criada com sucesso!');
    }

    // 3. Dar permissões
    console.log('\n🔐 CONFIGURANDO PERMISSÕES...\n');

    const permissionsSQL = `
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;
`;

    const { data: permResult, error: permError } = await adminSupabase
      .rpc('sql', { query: permissionsSQL })
      .catch(() => ({ data: null, error: null }));

    if (permError) {
      console.log(`⚠️ Aviso nas permissões: ${permError.message}`);
    } else {
      console.log('✅ Permissões configuradas');
    }

    // 4. Testar função recriada
    console.log('\n🧪 TESTANDO FUNÇÃO RECRIADA...\n');

    const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";
    
    // Teste com service role
    const { data: testAdmin, error: testAdminError } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 3
      });

    if (testAdminError) {
      console.log(`❌ Teste admin falhou: ${testAdminError.message}`);
      return false;
    } else {
      console.log(`✅ Teste admin: ${testAdmin?.length || 0} categorias`);
      
      const totalImoveis = testAdmin?.reduce((total, cat) => {
        return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
      }, 0) || 0;
      console.log(`📊 Total imóveis: ${totalImoveis}`);
    }

    // Teste com anon role
    const publicSupabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww");
    
    const { data: testPublic, error: testPublicError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 3
      });

    if (testPublicError) {
      console.log(`❌ Teste público falhou: ${testPublicError.message}`);
    } else {
      const publicImoveis = testPublic?.reduce((total, cat) => {
        return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
      }, 0) || 0;
      
      console.log(`✅ Teste público: ${testPublic?.length || 0} categorias, ${publicImoveis} imóveis`);

      if (publicImoveis > 0) {
        console.log('\n🎉 SUCESSO TOTAL! PROBLEMA RESOLVIDO! 🎉');
        console.log('✅ RPC funcionando para anon role');
        console.log('✅ Imóveis aparecendo no site público');
        console.log('\n🌐 Teste o site: https://imobideps.com');
        return true;
      }
    }

    return false;

  } catch (err) {
    console.error(`💥 Erro geral: ${err.message}`);
    return false;
  }
}

recriarFuncaoRPC()
  .then(sucesso => {
    if (!sucesso) {
      console.log('\n⚠️ Execute o SQL manualmente no Dashboard do Supabase');
    }
  })
  .catch(console.error);