#!/bin/bash

# Script para conectar ao Supabase e executar comandos
# Carrega variáveis de ambiente do frontend/.env.local

cd /workspaces/danierickgithub/frontend

# Carregar variáveis de ambiente
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas"
else
    echo "❌ .env.local não encontrado"
    exit 1
fi

# Extrair project ref da URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')

echo "📊 Informações do Projeto:"
echo "   Project Ref: $PROJECT_REF"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Executar comando SQL passado como argumento
if [ "$1" == "exec" ]; then
    shift
    SQL_COMMAND="$@"
    
    echo "🔄 Executando SQL via API..."
    curl -X POST \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$SQL_COMMAND\"}"
    
elif [ "$1" == "tables" ]; then
    echo "📋 Listando tabelas..."
    curl -X GET \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.definitions | keys[]' 2>/dev/null || echo "Instale jq para melhor formatação: sudo apt-get install jq"

elif [ "$1" == "migration" ]; then
    echo "🚀 Executando migration: $2"
    if [ -f "../supabase/migrations/$2" ]; then
        SQL_CONTENT=$(cat "../supabase/migrations/$2")
        echo "Conteúdo da migration:"
        echo "$SQL_CONTENT"
        echo ""
        echo "Execute no SQL Editor do Supabase:"
        echo "$NEXT_PUBLIC_SUPABASE_URL/project/$PROJECT_REF/sql/new"
    else
        echo "❌ Arquivo não encontrado: ../supabase/migrations/$2"
    fi

else
    echo "📖 Uso:"
    echo "   ./supabase-connect.sh tables              - Listar tabelas"
    echo "   ./supabase-connect.sh exec \"SQL HERE\"     - Executar SQL"
    echo "   ./supabase-connect.sh migration ARQUIVO   - Ver migration"
    echo ""
    echo "🔗 Links úteis:"
    echo "   Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
    echo "   SQL Editor: $NEXT_PUBLIC_SUPABASE_URL/project/$PROJECT_REF/sql/new"
    echo "   Table Editor: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
fi
