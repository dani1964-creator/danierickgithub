#!/usr/bin/env node

/**
 * CORREÇÃO IMEDIATA: PERMISSÕES RPC
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function corrigirRPC() {
  console.log('🔧 CORREÇÃO IMEDIATA: PERMISSÕES RPC\n');
  console.log('=' .repeat(50));

  try {
    // 1. Recriar a função com SECURITY DEFINER
    console.log('🔄 RECRIANDO FUNÇÃO RPC COM SECURITY DEFINER...\n');

    const sqlFunction = `
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
SECURITY DEFINER  -- ESTA É A LINHA CRUCIAL!
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
          'location', p.location,
          'property_type', p.property_type,
          'transaction_type', p.transaction_type,
          'bedrooms', p.bedrooms,
          'bathrooms', p.bathrooms,
          'area', p.area,
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

-- Dar permissões para anon e authenticated
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;
`;

    const { data, error } = await adminSupabase.rpc('exec_sql', { 
      sql: sqlFunction 
    });

    if (error) {
      console.log(`❌ Erro ao recriar função: ${error.message}`);
      
      // Tentar método alternativo - executar via SQL direto
      console.log('\n🔄 TENTANDO MÉTODO ALTERNATIVO...\n');
      
      const { data: altData, error: altError } = await adminSupabase
        .from('_anything_') // Não importa, só queremos executar SQL
        .select('*')
        .eq('fake', 'fake'); // Query fake só para trigger o SQL

      console.log('❌ Método direto não disponível via client JS');
      console.log('\n📋 SQL PARA EXECUTAR MANUALMENTE NO DASHBOARD:\n');
      console.log(sqlFunction);
      console.log('\n' + '=' .repeat(50));
      
    } else {
      console.log('✅ Função recriada com sucesso!');
    }

    // 2. Testar a função corrigida
    console.log('\n🧪 TESTANDO FUNÇÃO CORRIGIDA...\n');

    const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";
    
    // Teste com anon role
    const publicSupabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODE5NX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww");
    
    const { data: testData, error: testError } = await publicSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 12
      });

    if (testError) {
      console.log(`❌ Teste falhou: ${testError.message}`);
    } else {
      console.log(`✅ Teste bem-sucedido: ${testData?.length || 0} categorias`);
      
      const totalImoveis = testData?.reduce((total, cat) => {
        return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
      }, 0) || 0;

      console.log(`📊 Total de imóveis retornados: ${totalImoveis}`);
      
      if (totalImoveis > 0) {
        console.log('\n🎉 PROBLEMA RESOLVIDO! IMÓVEIS APARECENDO!');
      } else {
        console.log('\n⚠️ Ainda sem imóveis - pode precisar executar SQL manualmente');
      }
    }

  } catch (err) {
    console.error(`💥 Erro geral: ${err.message}`);
  }
}

corrigirRPC().catch(console.error);