-- RPC Function para criar associações imóvel-categoria
-- Esta função roda com privilégios do owner (SECURITY DEFINER) 
-- para contornar políticas RLS

CREATE OR REPLACE FUNCTION create_property_category_associations(
  p_broker_id UUID
)
RETURNS TABLE(
  associations_created INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property RECORD;
  v_category_destaque UUID;
  v_category_todos UUID;
  v_associations_count INTEGER := 0;
BEGIN
  -- Buscar categorias do broker
  SELECT id INTO v_category_destaque 
  FROM property_categories 
  WHERE broker_id = p_broker_id AND slug = 'destaque' AND is_active = true;
  
  SELECT id INTO v_category_todos 
  FROM property_categories 
  WHERE broker_id = p_broker_id AND slug = 'todos' AND is_active = true;
  
  -- Se não há categorias, retornar erro
  IF v_category_todos IS NULL THEN
    RETURN QUERY SELECT 0, 'Categoria "Todos os Imóveis" não encontrada';
    RETURN;
  END IF;
  
  -- Limpar associações existentes do broker
  DELETE FROM property_category_assignments WHERE broker_id = p_broker_id;
  
  -- Para cada imóvel ativo e publicado do broker
  FOR v_property IN 
    SELECT id, title, is_featured
    FROM properties 
    WHERE broker_id = p_broker_id 
      AND is_active = true 
      AND is_published = true
  LOOP
    -- Associar à categoria "Todos os Imóveis"
    INSERT INTO property_category_assignments (property_id, category_id, broker_id)
    VALUES (v_property.id, v_category_todos, p_broker_id);
    
    v_associations_count := v_associations_count + 1;
    
    -- Se for imóvel em destaque, associar também à categoria destaque
    IF v_property.is_featured = true AND v_category_destaque IS NOT NULL THEN
      INSERT INTO property_category_assignments (property_id, category_id, broker_id)
      VALUES (v_property.id, v_category_destaque, p_broker_id);
      
      v_associations_count := v_associations_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_associations_count, 'Associações criadas com sucesso';
END;
$$;