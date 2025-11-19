#!/bin/bash

# Script para verificar e criar zona DNS no Digital Ocean
# Uso: ./verificar-criar-zona-do.sh maisexpansaodeconsciencia.site

DOMAIN=$1
DO_TOKEN=${DO_ACCESS_TOKEN}

if [ -z "$DOMAIN" ]; then
  echo "❌ Uso: $0 <dominio>"
  exit 1
fi

if [ -z "$DO_TOKEN" ]; then
  echo "❌ Variável DO_ACCESS_TOKEN não configurada"
  echo "Configure: export DO_ACCESS_TOKEN='seu_token_aqui'"
  exit 1
fi

echo "🔍 Verificando zona $DOMAIN na Digital Ocean..."

# Verificar se zona existe
RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $DO_TOKEN" \
  "https://api.digitalocean.com/v2/domains/$DOMAIN")

if echo "$RESPONSE" | grep -q "\"name\":\"$DOMAIN\""; then
  echo "✅ Zona $DOMAIN já existe na Digital Ocean!"
  echo ""
  echo "📋 Nameservers:"
  echo "$RESPONSE" | jq -r '.domain.name_servers[]' 2>/dev/null || echo "$RESPONSE"
  exit 0
fi

echo "⚠️  Zona não encontrada. Criando zona $DOMAIN..."

# Criar zona (use o IP do seu app)
APP_IP="162.159.140.98"

CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $DO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$DOMAIN\",\"ip_address\":\"$APP_IP\"}" \
  "https://api.digitalocean.com/v2/domains")

if echo "$CREATE_RESPONSE" | grep -q "\"name\":\"$DOMAIN\""; then
  echo "✅ Zona $DOMAIN criada com sucesso!"
  echo ""
  echo "📋 Nameservers para configurar no GoDaddy:"
  echo "$CREATE_RESPONSE" | jq -r '.domain.name_servers[]'
  echo ""
  echo "🔧 Agora configure esses nameservers no GoDaddy:"
  echo "   1. Acesse: https://dcc.godaddy.com/domains"
  echo "   2. Clique em '$DOMAIN'"
  echo "   3. Vá em 'DNS' > 'Nameservers' > 'Change'"
  echo "   4. Selecione 'Custom' e adicione os nameservers acima"
  exit 0
else
  echo "❌ Erro ao criar zona:"
  echo "$CREATE_RESPONSE" | jq . 2>/dev/null || echo "$CREATE_RESPONSE"
  exit 1
fi
