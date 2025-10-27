#!/bin/bash

# Script para investigar o broker 'danierick' especificamente

SUPABASE_URL="https://demcjskpwcxqohzlyjxb.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww"

echo "🔍 Investigando broker 'danierick'..."
echo ""

# 1. Verificar se existe broker com slug 'danierick'
echo "📊 Procurando broker com slug 'danierick':"
BROKER_DATA=$(curl -s "$SUPABASE_URL/rest/v1/brokers?select=id,business_name,website_slug,email,is_active&website_slug=eq.danierick" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")

echo "$BROKER_DATA" | jq .

if [ "$(echo "$BROKER_DATA" | jq length)" -eq 0 ]; then
  echo ""
  echo "❌ Nenhum broker encontrado com slug 'danierick'"
  echo ""
  echo "📋 Todos os brokers no sistema:"
  curl -s "$SUPABASE_URL/rest/v1/brokers?select=id,business_name,website_slug,email,is_active" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" | jq .
else
  echo ""
  echo "✅ Broker encontrado!"
  
  # 2. Testar função RPC
  echo ""
  echo "🔧 Testando função get_broker_by_domain_or_slug:"
  curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/get_broker_by_domain_or_slug" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"website_slug_param": "danierick"}' | jq .
  
  # 3. Verificar propriedades
  echo ""
  echo "🏠 Propriedades do broker 'danierick':"
  BROKER_ID=$(echo "$BROKER_DATA" | jq -r '.[0].id')
  curl -s "$SUPABASE_URL/rest/v1/properties?select=id,title,slug,is_active&broker_id=eq.$BROKER_ID&limit=5" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" | jq .
fi

echo ""
echo "🌐 URLs para teste:"
echo "- Produção: https://adminimobiliaria.site/danierick"
echo "- DigitalOcean: https://adminimobiliaria-8cx7x.ondigitalocean.app/danierick"