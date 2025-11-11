#!/bin/bash

# Script para executar SQL diretamente no Supabase via psql

cd /workspaces/danierickgithub/frontend

# Carregar variáveis de ambiente
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ .env.local não encontrado"
    exit 1
fi

# Extrair informações do projeto
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')

# Construir connection string
# Formato: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

echo "🔐 Para executar SQL diretamente, você precisa:"
echo ""
echo "1. Ir ao Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo ""
echo "2. Copiar a 'Connection String' em 'Connection Pooling'"
echo ""
echo "3. Executar:"
echo "   psql 'postgresql://postgres.$PROJECT_REF:[SUA-SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
echo ""
echo "---"
echo ""
echo "✅ OU execute a migration no SQL Editor do Supabase:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "📄 Conteúdo para copiar e colar:"
echo ""
cat ../supabase/migrations/20251111030000_support_uuid_in_property_detail.sql
