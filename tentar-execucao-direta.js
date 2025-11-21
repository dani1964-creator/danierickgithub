#!/usr/bin/env node

/**
 * TENTATIVA DE EXECUÇÃO DIRETA VIA FETCH
 */

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

async function tentarExecucaoDireta() {
  console.log('🚀 TENTATIVA DE EXECUÇÃO DIRETA VIA FETCH API\n');
  
  const sql = `
-- REMOVER FUNÇÃO EXISTENTE
DROP FUNCTION IF EXISTS get_homepage_categories_with_properties CASCADE;

-- CRIAR NOVA FUNÇÃO
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

-- PERMISSÕES
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;
`;

  try {
    // Tentar via REST API do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ SQL executado com sucesso via REST API!');
      return true;
    } else {
      console.log(`❌ Erro REST API: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.log(`💥 Erro REST API: ${err.message}`);
  }

  try {
    // Tentar via endpoint SQL direto
    const response2 = await fetch(`${SUPABASE_URL}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/sql',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: sql
    });

    if (response2.ok) {
      console.log('✅ SQL executado com sucesso via endpoint direto!');
      return true;
    } else {
      console.log(`❌ Erro endpoint SQL: ${response2.status} ${response2.statusText}`);
    }
  } catch (err) {
    console.log(`💥 Erro endpoint SQL: ${err.message}`);
  }

  console.log('\n📋 EXECUÇÃO AUTOMÁTICA FALHOU - EXECUTE MANUALMENTE:\n');
  console.log('=' .repeat(60));
  console.log('1. Abra o Dashboard do Supabase');
  console.log('2. Vá em SQL Editor');
  console.log('3. Execute o conteúdo do arquivo: EXECUTAR-NO-DASHBOARD.sql');
  console.log('4. Teste com: node teste-final.js');
  console.log('=' .repeat(60));

  return false;
}

tentarExecucaoDireta().catch(console.error);