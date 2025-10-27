#!/bin/bash

# Script para criar broker 'danierick' usando service role key

SUPABASE_URL="https://demcjskpwcxqohzlyjxb.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM"

echo "🚀 Criando broker 'danierick' com permissões administrativas..."

# Dados do broker
BROKER_DATA='{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "business_name": "Danierick Imobiliária",
  "website_slug": "danierick", 
  "email": "danierick@adminimobiliaria.com",
  "phone": "(11) 99999-7777",
  "address": "Rua Principal, 100",
  "city": "São Paulo",
  "uf": "SP", 
  "cep": "01234-567",
  "primary_color": "#1e40af",
  "secondary_color": "#6b7280",
  "is_active": true,
  "subscription_status": "active",
  "subscription_tier": "pro",
  "site_title": "Danierick Imobiliária - Seu Imóvel dos Sonhos",
  "site_description": "Encontre o imóvel perfeito com a Danierick Imobiliária. Atendimento especializado e as melhores oportunidades do mercado."
}'

# Criar broker
echo "📊 Inserindo broker no banco..."
RESULT=$(curl -s -X POST "$SUPABASE_URL/rest/v1/brokers" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$BROKER_DATA")

echo "Resultado:"
echo "$RESULT" | jq .

# Verificar se foi criado
echo ""
echo "🔍 Verificando se broker foi criado..."
VERIFICATION=$(curl -s "$SUPABASE_URL/rest/v1/brokers?select=id,business_name,website_slug&website_slug=eq.danierick" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")

echo "Verificação:"
echo "$VERIFICATION" | jq .

# Testar função RPC
echo ""
echo "🔧 Testando função get_broker_by_domain_or_slug..."
RPC_TEST=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/get_broker_by_domain_or_slug" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"website_slug_param": "danierick"}')

echo "Resultado RPC:"
echo "$RPC_TEST" | jq .

echo ""
echo "✅ Processo concluído!"
echo "🌐 Teste agora em:"
echo "- DigitalOcean: https://adminimobiliaria-8cx7x.ondigitalocean.app/danierick"
echo "- Cloudflare: https://adminimobiliaria.site/danierick"