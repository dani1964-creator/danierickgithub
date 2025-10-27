#!/bin/bash

# Script para criar broker "danierick" via API REST do Supabase

SUPABASE_URL="https://demcjskpwcxqohzlyjxb.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww"

echo "🚀 Criando broker 'danierick'..."

# Verificar se broker já existe
echo "🔍 Verificando se broker já existe..."
EXISTING_BROKER=$(curl -s \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/brokers?website_slug=eq.danierick&select=id,business_name,website_slug")

echo "Brokers existentes: $EXISTING_BROKER"

# Verificar se retornou array vazio []
if [ "$EXISTING_BROKER" = "[]" ]; then
  echo "📝 Criando novo broker..."
  
  # Criar broker
  BROKER_RESULT=$(curl -s -X POST \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d '{
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "business_name": "Danierick Imobiliária",
      "website_slug": "danierick",
      "email": "danierick@adminimobiliaria.site",
      "phone": "(11) 99999-7777",
      "address": "Av. Principal, 1000 - Sala 101",
      "city": "São Paulo",
      "uf": "SP",
      "cep": "01310-100",
      "primary_color": "#1e40af",
      "secondary_color": "#64748b",
      "is_active": true,
      "subscription_status": "active",
      "subscription_tier": "pro",
      "site_title": "Danierick Imobiliária - Seu Imóvel Ideal",
      "site_description": "Encontre o imóvel perfeito com a Danierick Imobiliária. Especialistas em vendas e locações em São Paulo.",
      "subdomain": "danierick",
      "canonical_prefer_custom_domain": false
    }' \
    "$SUPABASE_URL/rest/v1/brokers")
  
  echo "✅ Resultado da criação do broker: $BROKER_RESULT"
else
  echo "✅ Broker 'danierick' já existe!"
fi

# Verificar resultado final
echo ""
echo "🔍 Verificação final..."
FINAL_CHECK=$(curl -s \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  "$SUPABASE_URL/rest/v1/brokers?website_slug=eq.danierick&select=id,business_name,website_slug,email,is_active")

echo "✅ Broker final: $FINAL_CHECK"

echo ""
echo "🎉 Setup completo!"
echo ""
echo "📍 URLs para testar:"
echo "   • https://adminimobiliaria.site/danierick"
echo "   • https://danierick.adminimobiliaria.site"
echo "   • http://localhost:5173/danierick (dev)"