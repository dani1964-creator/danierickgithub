#!/bin/bash

# Deploy script para Digital Ocean
# Execute este script no servidor DO

echo "🚀 Iniciando deploy no Digital Ocean..."



# Parar containers antigos
echo "⏹️ Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down

# Fazer pull do código mais recente
echo "📥 Fazendo pull do repositório..."
git pull origin main

# Construir e iniciar novos containers
echo "🔨 Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Limpeza de imagens antigas
echo "🧹 Removendo imagens não utilizadas..."
docker system prune -f

# Verificar status
echo "✅ Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Frontend: http://seu-servidor-ip"
echo "� Backend: http://seu-servidor-ip:3000"
echo ""
echo "📊 Para monitorar logs:"
echo "Frontend: docker-compose -f docker-compose.prod.yml logs -f frontend"
echo "Backend: docker-compose -f docker-compose.prod.yml logs -f backend"



# Verificar se está autenticado# Verificar se está autenticado

if ! doctl auth list | grep -q "current context"; thenif ! doctl auth list | grep -q "current context"; then

    echo "❌ doctl não está autenticado."    echo "❌ doctl não está autenticado."

    echo "🔑 Configure com: doctl auth init"    echo "🔑 Configure com: doctl auth init"

    exit 1    exit 1

fifi



# Configurações# Configurações

APP_NAME="imobi-saas-multi-tenant"APP_NAME="imobi-saas-multi-tenant"

REGION="nyc1"REGION="nyc1"

CONFIG_FILE=".do/app.yaml"CONFIG_FILE=".do/app.yaml"



echo "📋 Configurações do Deploy:"echo "📋 Configurações do Deploy:"

echo "   App Name: $APP_NAME"echo "   App Name: $APP_NAME"

echo "   Region: $REGION"echo "   Region: $REGION"

echo "   Config: $CONFIG_FILE"echo "   Config: $CONFIG_FILE"

echo ""echo ""



# Verificar se o arquivo de configuração existe# Verificar se o arquivo de configuração existe

if [ ! -f "$CONFIG_FILE" ]; thenif [ ! -f "$CONFIG_FILE" ]; then

    echo "❌ Arquivo de configuração não encontrado: $CONFIG_FILE"    echo "❌ Arquivo de configuração não encontrado: $CONFIG_FILE"

    exit 1    exit 1

fifi



# Verificar se a aplicação já existe# Verificar se a aplicação já existe

APP_EXISTS=$(doctl apps list --format Name --no-header | grep -w "$APP_NAME" || true)APP_EXISTS=$(doctl apps list --format Name --no-header | grep -w "$APP_NAME" || true)



if [ -n "$APP_EXISTS" ]; thenif [ -n "$APP_EXISTS" ]; then

    echo "🔄 Aplicação '$APP_NAME' já existe. Atualizando..."    echo "🔄 Aplicação '$APP_NAME' já existe. Atualizando..."

        

    # Obter ID da aplicação    # Obter ID da aplicação

    APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')    APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')

        

    if [ -z "$APP_ID" ]; then    if [ -z "$APP_ID" ]; then

        echo "❌ Não foi possível obter o ID da aplicação"        echo "❌ Não foi possível obter o ID da aplicação"

        exit 1        exit 1

    fi    fi

        

    echo "🆔 App ID: $APP_ID"    echo "🆔 App ID: $APP_ID"

        

    # Atualizar aplicação    # Atualizar aplicação

    echo "📤 Fazendo update da aplicação..."    echo "📤 Fazendo update da aplicação..."

    doctl apps update "$APP_ID" --spec "$CONFIG_FILE"    doctl apps update "$APP_ID" --spec "$CONFIG_FILE"

        

    echo "✅ Update iniciado com sucesso!"    echo "✅ Update iniciado com sucesso!"

    echo "🔗 Acompanhe o deploy em: https://cloud.digitalocean.com/apps/$APP_ID"    echo "🔗 Acompanhe o deploy em: https://cloud.digitalocean.com/apps/$APP_ID"

        

elseelse

    echo "🆕 Criando nova aplicação '$APP_NAME'..."    echo "🆕 Criando nova aplicação '$APP_NAME'..."

        

    # Criar nova aplicação    # Criar nova aplicação

    doctl apps create --spec "$CONFIG_FILE"    doctl apps create --spec "$CONFIG_FILE"

        

    echo "✅ Aplicação criada com sucesso!"    echo "✅ Aplicação criada com sucesso!"

    echo "🔗 Acesse o dashboard: https://cloud.digitalocean.com/apps"    echo "🔗 Acesse o dashboard: https://cloud.digitalocean.com/apps"

fifi



echo ""echo ""

echo "📋 Próximos passos:"echo "📋 Próximos passos:"

echo "1. Configure as environment variables no dashboard do Digital Ocean"echo "1. Configure as environment variables no dashboard do Digital Ocean"

echo "2. Configure os domínios personalizados"echo "2. Configure os domínios personalizados"

echo "3. Execute os comandos SQL no Supabase"echo "3. Execute os comandos SQL no Supabase"

echo "4. Configure o DNS no Cloudflare"echo "4. Configure o DNS no Cloudflare"



echo ""echo ""

echo "🔧 Environment variables necessárias:"echo "🔧 Environment variables necessárias:"

echo "   - SUPABASE_URL"echo "   - SUPABASE_URL"

echo "   - SUPABASE_ANON_KEY"  echo "   - SUPABASE_ANON_KEY"  

echo "   - SUPABASE_SERVICE_ROLE_KEY"echo "   - SUPABASE_SERVICE_ROLE_KEY"



echo ""echo ""

echo "🌐 Domínios para configurar:"echo "🌐 Domínios para configurar:"

echo "   - Domínio principal (ex: meuapp.com)"echo "   - Domínio principal (ex: meuapp.com)"

echo "   - Wildcard subdomínio (ex: *.meuapp.com)"echo "   - Wildcard subdomínio (ex: *.meuapp.com)"



echo ""echo ""

echo "✅ Deploy concluído!"echo "✅ Deploy concluído!"