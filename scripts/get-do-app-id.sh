#!/bin/bash

# Script para obter o DO_APP_ID do whale-app

echo "🔍 Buscando DO_APP_ID do whale-app..."
echo ""

# Verificar se DO_ACCESS_TOKEN está configurado
if [ -z "$DO_ACCESS_TOKEN" ]; then
    echo "❌ Erro: DO_ACCESS_TOKEN não está configurado"
    echo ""
    echo "Configure com:"
    echo "export DO_ACCESS_TOKEN='seu_token_aqui'"
    exit 1
fi

# Buscar apps no Digital Ocean
echo "📡 Consultando Digital Ocean API..."
response=$(curl -s -X GET \
    -H "Authorization: Bearer $DO_ACCESS_TOKEN" \
    "https://api.digitalocean.com/v2/apps")

# Verificar se curl funcionou
if [ $? -ne 0 ]; then
    echo "❌ Erro ao consultar API do Digital Ocean"
    exit 1
fi

# Extrair ID do whale-app
app_id=$(echo "$response" | grep -o '"id":"[^"]*"' | grep -B5 '"name":"whale-app"' | grep '"id"' | head -1 | cut -d'"' -f4)

if [ -z "$app_id" ]; then
    echo "❌ Não foi possível encontrar o whale-app"
    echo ""
    echo "Apps disponíveis:"
    echo "$response" | grep -o '"name":"[^"]*"' | cut -d'"' -f4
    exit 1
fi

echo "✅ DO_APP_ID encontrado!"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "   $app_id"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 Adicione essa variável no Digital Ocean App Platform:"
echo ""
echo "1. Acesse: https://cloud.digitalocean.com/apps"
echo "2. Clique em 'whale-app'"
echo "3. Vá em: Settings → App-Level Environment Variables"
echo "4. Clique em 'Edit' e adicione:"
echo ""
echo "   Key: DO_APP_ID"
echo "   Value: $app_id"
echo "   Encrypted: NO"
echo "   Scope: RUN_AND_BUILD_TIME"
echo ""
echo "5. Clique em 'Save'"
echo ""
echo "✅ Após salvar, o sistema provisionará SSL automaticamente!"
