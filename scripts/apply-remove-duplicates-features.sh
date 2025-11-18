#!/bin/bash

# =====================================================
# Script para remover duplicatas de features
# =====================================================

set -e

echo "🔍 Removendo duplicatas de Elevador e Portaria 24h do array features..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se o arquivo SQL existe
if [ ! -f "scripts/REMOVER_DUPLICATAS_FEATURES.sql" ]; then
  echo -e "${RED}❌ Erro: Arquivo SQL não encontrado!${NC}"
  exit 1
fi

# Pedir confirmação
echo -e "${YELLOW}⚠️  Este script irá:${NC}"
echo "   1. Criar backup da tabela properties (campo features)"
echo "   2. Remover 'Elevador' e 'Portaria 24h' do array features"
echo "   3. Manter os campos boolean elevator e portaria_24h intactos"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo -e "${YELLOW}Operação cancelada.${NC}"
  exit 0
fi

# Aplicar script SQL
echo -e "${GREEN}✓ Aplicando script SQL...${NC}"

# Se estiver usando Supabase localmente
if command -v supabase &> /dev/null; then
  supabase db execute < scripts/REMOVER_DUPLICATAS_FEATURES.sql
  echo -e "${GREEN}✓ Script aplicado com sucesso via Supabase CLI${NC}"
  
# Se estiver usando psql direto
elif command -v psql &> /dev/null; then
  # Assumindo variáveis de ambiente DATABASE_URL ou similar
  psql $DATABASE_URL -f scripts/REMOVER_DUPLICATAS_FEATURES.sql
  echo -e "${GREEN}✓ Script aplicado com sucesso via psql${NC}"
  
else
  echo -e "${YELLOW}⚠️  Execute o SQL manualmente no Supabase Dashboard:${NC}"
  echo "   1. Acesse: https://supabase.com/dashboard"
  echo "   2. Vá em SQL Editor"
  echo "   3. Cole o conteúdo de: scripts/REMOVER_DUPLICATAS_FEATURES.sql"
  echo "   4. Execute"
fi

echo ""
echo -e "${GREEN}✅ Concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "  - Verifique os logs acima para confirmar as mudanças"
echo "  - Teste no site público se as features aparecem corretamente"
echo "  - Se houver problemas, use o ROLLBACK no final do SQL"
