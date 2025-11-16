-- ============================================================================
-- SCRIPT REVISADO - STORAGE E COMUNICAÇÕES PRIVADAS
-- ============================================================================
-- Execute este script completo no Supabase SQL Editor
-- Data: 2025-11-16
-- ============================================================================

-- ============================================================================
-- PARTE 1: BUCKET DE ANEXOS (PRIVADO)
-- ============================================================================

-- 1. Criar bucket 'attachments' PRIVADO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false, -- PRIVADO - apenas autenticados podem acessar
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- 2. Limpar policies antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de anexos" ON storage.objects;
DROP POLICY IF EXISTS "Anexos são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios anexos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios anexos" ON storage.objects;
DROP POLICY IF EXISTS "Brokers podem fazer upload de anexos" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode visualizar todos os anexos" ON storage.objects;

-- 3. RLS Policy: Brokers podem fazer upload
CREATE POLICY "Brokers podem fazer upload de anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
);

-- 4. RLS Policy: Admin pode ver tudo, brokers só seus arquivos
CREATE POLICY "Admin pode visualizar todos os anexos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (
    -- Super admin pode ver tudo
    EXISTS (
      SELECT 1 FROM brokers 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
    -- Ou o próprio usuário pode ver seus arquivos
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- 5. RLS Policy: Deletar apenas próprios arquivos
CREATE POLICY "Usuários podem deletar seus próprios anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- PARTE 2: ADICIONAR COLUNA attachment_url NA TABELA subscription_communications
-- ============================================================================

-- Adicionar coluna para armazenar URL do anexo
ALTER TABLE subscription_communications 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_subscription_communications_attachment 
ON subscription_communications(attachment_url) 
WHERE attachment_url IS NOT NULL;

-- ============================================================================
-- PARTE 3: POLÍTICAS RLS PARA subscription_communications
-- ============================================================================

-- Garantir que RLS está ativado
ALTER TABLE subscription_communications ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas
DROP POLICY IF EXISTS "Brokers podem ver apenas suas comunicações" ON subscription_communications;
DROP POLICY IF EXISTS "Brokers podem criar comunicações" ON subscription_communications;
DROP POLICY IF EXISTS "Admin pode ver todas comunicações" ON subscription_communications;
DROP POLICY IF EXISTS "Admin pode atualizar comunicações" ON subscription_communications;

-- Policy: Brokers veem apenas suas mensagens
CREATE POLICY "Brokers podem ver apenas suas comunicações"
ON subscription_communications
FOR SELECT
TO authenticated
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM brokers 
    WHERE user_id = auth.uid() 
    AND is_super_admin = true
  )
);

-- Policy: Brokers podem criar mensagens
CREATE POLICY "Brokers podem criar comunicações"
ON subscription_communications
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id IN (
    SELECT id FROM brokers WHERE user_id = auth.uid()
  )
);

-- Policy: Admin pode atualizar (marcar como lido)
CREATE POLICY "Admin pode atualizar comunicações"
ON subscription_communications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM brokers 
    WHERE user_id = auth.uid() 
    AND is_super_admin = true
  )
);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- 1. Verificar bucket criado
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'attachments';

-- 2. Verificar policies do storage
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (policyname LIKE '%anexo%' OR policyname LIKE '%Brokers%' OR policyname LIKE '%Admin%');

-- 3. Verificar coluna attachment_url
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_communications' 
  AND column_name = 'attachment_url';

-- 4. Verificar policies da tabela subscription_communications
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'subscription_communications';
