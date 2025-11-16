-- ============================================================================
-- APLICAR NO SUPABASE SQL EDITOR
-- ============================================================================
-- Este script cria o bucket de storage para anexos de comprovantes de pagamento
-- Execute diretamente no Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Criar bucket 'attachments' (público para permitir visualização)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
);

-- 3. RLS Policy: Permitir leitura pública dos anexos
CREATE POLICY "Anexos são publicamente acessíveis"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- 4. RLS Policy: Usuários podem atualizar seus próprios anexos
CREATE POLICY "Usuários podem atualizar seus próprios anexos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'attachments'
);

-- 5. RLS Policy: Usuários podem deletar seus próprios anexos
CREATE POLICY "Usuários podem deletar seus próprios anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Execute esta query para confirmar que o bucket foi criado:
SELECT * FROM storage.buckets WHERE id = 'attachments';

-- Execute esta query para ver as policies criadas:
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%anexo%';

-- ============================================================================
-- RESULTADO ESPERADO:
-- - Bucket 'attachments' criado com limite de 5MB
-- - 4 policies de RLS configuradas
-- - Upload funcional para usuários autenticados
-- ============================================================================
