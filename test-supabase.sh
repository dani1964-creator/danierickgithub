#!/bin/bash

# Script para testar a API do Supabase

SUPABASE_URL="https://demcjskpwcxqohzlyjxb.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww"

echo "=== Testando conexão com Supabase ==="
echo "URL: $SUPABASE_URL"

echo -e "\n=== Listando brokers existentes ==="
curl -s "$SUPABASE_URL/rest/v1/brokers?select=id,business_name,website_slug,custom_domain" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq '.'

echo -e "\n=== Testando função get_broker_by_domain_or_slug ==="
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/get_broker_by_domain_or_slug" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"website_slug_param": "teste"}' | jq '.'

echo -e "\n=== Teste concluído ==="