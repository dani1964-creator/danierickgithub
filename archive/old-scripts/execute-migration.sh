#!/bin/bash

# Script para executar migration via psql
# Uso: ./execute-migration.sh [SUA_SENHA_DO_SUPABASE]

if [ -z "$1" ]; then
    echo "❌ Erro: Senha do Supabase necessária"
    echo ""
    echo "📖 Uso: ./execute-migration.sh [SUA_SENHA]"
    echo ""
    echo "🔑 Para obter a senha:"
    echo "   1. Acesse: https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/settings/database"
    echo "   2. Role até 'Database password'"
    echo "   3. Clique em 'Reset database password' (se necessário)"
    echo "   4. Copie a senha gerada"
    echo ""
    exit 1
fi

PASSWORD="$1"
PROJECT_REF="demcjskpwcxqohzlyjxb"
MIGRATION_FILE="/workspaces/danierickgithub/supabase/migrations/20251111030000_support_uuid_in_property_detail.sql"

echo "🚀 Executando migration SQL..."
echo "   Projeto: $PROJECT_REF"
echo "   Arquivo: $MIGRATION_FILE"
echo ""

# Executar migration
PGPASSWORD="$PASSWORD" psql \
  "postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration executada com sucesso!"
    echo ""
    echo "🎉 Agora as URLs podem usar slug ou UUID:"
    echo "   - https://danierick.adminimobiliaria.site/apartamento-3-quartos-centro"
    echo "   - https://danierick.adminimobiliaria.site/123e4567-e89b-12d3-a456-426614174000"
else
    echo ""
    echo "❌ Erro ao executar migration"
    echo ""
    echo "💡 Alternativa: Execute manualmente no SQL Editor:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
fi
