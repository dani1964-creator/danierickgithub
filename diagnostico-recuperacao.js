#!/usr/bin/env node

/**
 * SCRIPT DE RECUPERAÇÃO SEGURA
 * Verifica se a função foi quebrada e a recria
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticoRecuperacao() {
  console.log('🚨 DIAGNÓSTICO DE RECUPERAÇÃO\n');
  console.log('=' .repeat(50));

  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  // 1. Verificar se a função existe
  console.log('🔍 1. VERIFICANDO SE A FUNÇÃO EXISTE...\n');
  
  try {
    const { data, error } = await adminSupabase
      .rpc('get_homepage_categories_with_properties', {
        p_broker_id: brokerId,
        p_properties_per_category: 1
      });

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ FUNÇÃO FOI DELETADA E NÃO RECRIADA!');
        console.log('🔧 Precisamos recriar a função...\n');
        return 'FUNCAO_NAO_EXISTE';
      } else if (error.message.includes('structure of query')) {
        console.log('❌ FUNÇÃO EXISTE MAS COM ESTRUTURA QUEBRADA!');
        console.log('🔧 Precisamos recriar a função...\n');
        return 'ESTRUTURA_QUEBRADA';
      } else {
        console.log(`❌ Outro erro: ${error.message}`);
        return 'OUTRO_ERRO';
      }
    } else {
      console.log('✅ FUNÇÃO EXISTE E FUNCIONOU!');
      console.log(`📊 Retornou ${data?.length || 0} categorias`);
      return 'FUNCIONANDO';
    }
  } catch (err) {
    console.log(`💥 Erro na verificação: ${err.message}`);
    return 'ERRO_CRITICO';
  }
}

async function criarFuncaoSegura() {
  console.log('🔧 CRIANDO FUNÇÃO SEGURA (SEM DROP)...\n');
  
  // Versão que consulta as tabelas diretamente, sem depender da estrutura antiga
  const funcaoSegura = `
-- FUNÇÃO SEGURA DE RECUPERAÇÃO
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
DECLARE
  category_record RECORD;
  property_record RECORD;
  category_result RECORD;
BEGIN
  -- Loop através das categorias
  FOR category_record IN 
    SELECT id, name, slug, description
    FROM property_categories 
    WHERE broker_id = p_broker_id 
      AND is_active = true 
      AND show_on_homepage = true
    ORDER BY name
  LOOP
    -- Contar imóveis para esta categoria
    SELECT COUNT(DISTINCT pca.property_id) INTO category_result.prop_count
    FROM property_category_assignments pca
    INNER JOIN properties p ON pca.property_id = p.id
    WHERE pca.category_id = category_record.id 
      AND pca.broker_id = p_broker_id
      AND p.is_active = true 
      AND p.is_published = true;
    
    -- Buscar imóveis para esta categoria
    SELECT jsonb_agg(
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
    ) INTO category_result.prop_json
    FROM property_category_assignments pca
    INNER JOIN properties p ON pca.property_id = p.id
    WHERE pca.category_id = category_record.id 
      AND pca.broker_id = p_broker_id
      AND p.is_active = true 
      AND p.is_published = true
    LIMIT p_properties_per_category;
    
    -- Retornar linha para esta categoria
    RETURN QUERY SELECT 
      category_record.id,
      category_record.name,
      category_record.slug,
      category_record.description,
      COALESCE(category_result.prop_count, 0)::BIGINT,
      COALESCE(category_result.prop_json, '[]'::jsonb);
  END LOOP;
  
  RETURN;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;
`;

  console.log('📋 SQL SEGURO PARA RECUPERAÇÃO:\n');
  console.log('=' .repeat(60));
  console.log(funcaoSegura);
  console.log('=' .repeat(60));
  
  return funcaoSegura;
}

async function main() {
  const status = await diagnosticoRecuperacao();
  
  if (status === 'FUNCIONANDO') {
    console.log('🎉 TUDO OK! A função está funcionando corretamente!');
    return;
  }

  console.log('🚨 PROBLEMA DETECTADO!');
  console.log('\n💡 SOLUÇÃO:');
  
  if (status === 'FUNCAO_NAO_EXISTE' || status === 'ESTRUTURA_QUEBRADA') {
    const sqlSeguro = await criarFuncaoSegura();
    
    console.log('\n📋 EXECUTE ESTE SQL NO DASHBOARD PARA RECUPERAR:\n');
    console.log('1. Vá no Dashboard do Supabase');
    console.log('2. SQL Editor');
    console.log('3. Cole o SQL acima');
    console.log('4. Execute');
    console.log('5. Teste novamente com: node teste-final.js\n');
    
    // Salvar em arquivo para facilitar
    require('fs').writeFileSync('./RECUPERACAO-SEGURA.sql', sqlSeguro);
    console.log('✅ SQL salvo em: RECUPERACAO-SEGURA.sql');
  }
}

main().catch(console.error);