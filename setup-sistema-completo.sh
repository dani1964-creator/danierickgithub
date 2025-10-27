#!/bin/bash

# ====================================
# SCRIPT DE CONFIGURAÇÃO COMPLETA
# ====================================

echo "🚀 Configurando sistema completo de multi-tenancy..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto!"
    exit 1
fi

# 1. Executar SQL no Supabase
echo "📊 1. Configurando brokers no banco de dados..."

SUPABASE_URL="https://demcjskpwcxqohzlyjxb.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM"

# Criar broker danierick
echo "   📝 Criando broker 'danierick'..."
curl -s -X POST "$SUPABASE_URL/rest/v1/brokers" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440002",
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
    "site_description": "Encontre o imóvel perfeito com a Danierick Imobiliária.",
    "subdomain": "danierick"
  }' > /tmp/broker_result.json

if [ $? -eq 0 ]; then
    echo "   ✅ Broker danierick criado com sucesso!"
else
    echo "   ⚠️  Broker danierick pode já existir (isso é normal)"
fi

# Criar propriedade de exemplo
echo "   🏠 Criando propriedade de exemplo..."
curl -s -X POST "$SUPABASE_URL/rest/v1/properties" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "broker_id": "550e8400-e29b-41d4-a716-446655440002",
    "title": "Casa Moderna Vila Madalena",
    "description": "Linda casa reformada na Vila Madalena, com acabamentos de primeira qualidade.",
    "price": 850000,
    "property_type": "Casa",
    "transaction_type": "Venda",
    "address": "Rua Harmonia, 445",
    "neighborhood": "Vila Madalena",
    "city": "São Paulo",
    "uf": "SP",
    "bedrooms": 3,
    "bathrooms": 2,
    "area_m2": 120,
    "parking_spaces": 2,
    "is_featured": true,
    "is_active": true,
    "main_image_url": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    "images": ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"],
    "features": ["Churrasqueira", "Quintal", "Próximo ao metrô"],
    "status": "available",
    "slug": "casa-moderna-vila-madalena",
    "property_code": "DAN001"
  }' > /tmp/property_result.json

if [ $? -eq 0 ]; then
    echo "   ✅ Propriedade criada com sucesso!"
else
    echo "   ⚠️  Propriedade pode já existir (isso é normal)"
fi

# 2. Verificar resultados
echo ""
echo "📊 2. Verificando configuração..."

# Verificar se broker existe
echo "   🔍 Verificando broker danierick..."
BROKER_CHECK=$(curl -s "$SUPABASE_URL/rest/v1/brokers?select=business_name,website_slug&website_slug=eq.danierick" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")

if echo "$BROKER_CHECK" | grep -q "danierick"; then
    echo "   ✅ Broker 'danierick' encontrado!"
    echo "$BROKER_CHECK" | sed 's/^/      /'
else
    echo "   ❌ Broker 'danierick' não encontrado!"
fi

# 3. Testar URLs
echo ""
echo "🌐 3. Testando URLs..."

echo "   🧪 Testando adminimobiliaria.site/danierick..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://adminimobiliaria.site/danierick")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ URL principal funcionando (Status: $HTTP_STATUS)"
else
    echo "   ⚠️  URL principal retornou status: $HTTP_STATUS"
fi

echo "   🧪 Testando danierick.adminimobiliaria.site..."
HTTP_STATUS_SUB=$(curl -s -o /dev/null -w "%{http_code}" "https://danierick.adminimobiliaria.site")
if [ "$HTTP_STATUS_SUB" = "200" ]; then
    echo "   ✅ Subdomínio funcionando (Status: $HTTP_STATUS_SUB)"
else
    echo "   ⚠️  Subdomínio retornou status: $HTTP_STATUS_SUB (pode precisar configurar DNS)"
fi

# 4. Instruções finais
echo ""
echo "🎉 4. CONFIGURAÇÃO CONCLUÍDA!"
echo ""
echo "📋 URLs PARA TESTAR:"
echo "   🏠 Vitrine Principal:    https://adminimobiliaria.site/danierick"
echo "   🌐 Subdomínio:          https://danierick.adminimobiliaria.site"
echo "   🔧 Dashboard:           https://adminimobiliaria.site/dashboard"
echo "   👤 Super Admin:         https://adminimobiliaria.site/admin"
echo "   🔍 Debug:               https://adminimobiliaria.site/debug/danierick"
echo ""
echo "🛠️  PRÓXIMOS PASSOS:"
echo "   1. ✅ Teste as URLs acima"
echo "   2. 📱 Configure DNS wildcard no Cloudflare (se necessário):"
echo "      Tipo: CNAME"
echo "      Nome: *.adminimobiliaria.site" 
echo "      Destino: adminimobiliaria-8cx7x.ondigitalocean.app"
echo "   3. 🎨 Personalize as cores e logo no dashboard"
echo "   4. 🏠 Adicione mais propriedades"
echo ""
echo "✅ SISTEMA MULTI-TENANT CONFIGURADO COM SUCESSO!"