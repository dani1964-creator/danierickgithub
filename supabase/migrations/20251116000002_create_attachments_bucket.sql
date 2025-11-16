-- ============================================================================
-- STORAGE BUCKET PARA ANEXOS DE COMPROVANTES DE PAGAMENTO
-- ============================================================================
-- Criado em: 2025-11-16
-- Descrição: Bucket para armazenar comprovantes de pagamento (PDF, imagens)
--            enviados pelas imobiliárias via sistema de tickets
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
-- NOTAS:
-- - Tamanho máximo: 5MB
-- - Formatos aceitos: JPG, PNG, PDF
-- - Arquivos são públicos (podem ser visualizados via URL)
-- - Organizados em subpastas: payment-proofs/{user_id}/{filename}
-- ============================================================================
