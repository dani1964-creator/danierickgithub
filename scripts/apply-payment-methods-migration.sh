#!/bin/bash

# Script para aplicar a migration de payment_methods no Supabase
# Certifique-se de ter as variáveis de ambiente configuradas:
# SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

set -e

echo "🔧 Aplicando migration de Payment Methods no Supabase..."
echo ""

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Erro: Variáveis de ambiente não configuradas!"
    echo ""
    echo "Configure as seguintes variáveis de ambiente:"
    echo "  export SUPABASE_URL='https://seu-projeto.supabase.co'"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='sua-service-role-key'"
    echo ""
    echo "Ou execute manualmente no SQL Editor do Supabase:"
    echo "  Arquivo: supabase/sql/APLICAR_PAYMENT_METHODS_PUBLIC.sql"
    exit 1
fi

# Ler o arquivo SQL
SQL_FILE="supabase/sql/APLICAR_PAYMENT_METHODS_PUBLIC.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Arquivo SQL não encontrado: $SQL_FILE"
    exit 1
fi

echo "📄 Lendo arquivo: $SQL_FILE"
SQL_CONTENT=$(cat "$SQL_FILE")

# Aplicar via API REST do Supabase
echo "🚀 Executando SQL no Supabase..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Migration aplicada com sucesso!"
    echo ""
    echo "🎉 Próximos passos:"
    echo "  1. Os métodos de pagamento agora aparecerão no site público"
    echo "  2. Edite um imóvel e adicione métodos de pagamento"
    echo "  3. Verifique no site público do imóvel"
else
    echo "❌ Erro ao aplicar migration (HTTP $HTTP_CODE)"
    echo "Resposta: $BODY"
    echo ""
    echo "📝 Solução alternativa:"
    echo "  1. Acesse o Supabase Dashboard"
    echo "  2. Vá em SQL Editor"
    echo "  3. Copie e cole o conteúdo de: $SQL_FILE"
    echo "  4. Execute (Run)"
    exit 1
fi
