#!/bin/bash

# Script para verificar e criar dados de teste no Supabase

SUPABASE_URL="https://demcjskpwcxqohzlyjxb.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM"

echo "🔍 Verificando dados no Supabase..."
echo ""

# Verificar brokers existentes
echo "📊 Brokers existentes:"
curl -s "$SUPABASE_URL/rest/v1/brokers?select=id,business_name,website_slug,email" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq -r '.[] | "- \(.business_name) (\(.website_slug)) - \(.email)"'

echo ""

# Verificar se função RPC existe
echo "🔧 Testando função get_broker_by_domain_or_slug:"
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/get_broker_by_domain_or_slug" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"website_slug_param": "imobiliaria-teste"}' | jq .

echo ""

# Se não há brokers, sugerir criação manual
BROKER_COUNT=$(curl -s "$SUPABASE_URL/rest/v1/brokers?select=id" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq length)

if [ "$BROKER_COUNT" -eq 0 ]; then
  echo "⚠️  Nenhum broker encontrado no banco de dados!"
  echo ""
  echo "💡 Para resolver o problema das vitrines 404:"
  echo "1. Acesse: http://localhost:3001/auth"
  echo "2. Crie uma conta de teste"
  echo "3. Configure sua imobiliária no dashboard"
  echo "4. Teste a vitrine em: http://localhost:3001/[slug-da-imobiliaria]"
  echo ""
else
  echo "✅ $BROKER_COUNT broker(s) encontrado(s)!"
  echo ""
  echo "🌐 URLs de teste disponíveis:"
  curl -s "$SUPABASE_URL/rest/v1/brokers?select=website_slug" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" | jq -r '.[] | "- Local: http://localhost:3001/\(.website_slug)\n- Produção: https://adminimobiliaria-8cx7x.ondigitalocean.app/\(.website_slug)"'
fi

echo ""
echo "✅ Verificação concluída!"