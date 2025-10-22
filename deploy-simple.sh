#!/bin/bash

# Deploy Script Simplificado para Digital Ocean
# Execute este script no servidor DO após clonar o repositório

echo "🚀 Iniciando deploy no Digital Ocean..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Faça logout e login novamente."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado."
fi

# Parar containers antigos (se existirem)
echo "⏹️ Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Fazer pull do código mais recente
echo "📥 Fazendo pull do repositório..."
git pull origin main

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️ Arquivo .env não encontrado. Criando do template..."
    cp .env.example .env
    echo "📝 IMPORTANTE: Edite o arquivo .env com suas configurações reais!"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY" 
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    read -p "Pressione Enter após configurar o arquivo .env..."
fi

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar status
echo "✅ Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
echo "📋 Primeiras linhas dos logs:"
echo "=== FRONTEND ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend
echo ""
echo "=== BACKEND ==="
docker-compose -f docker-compose.prod.yml logs --tail=10 backend

echo ""
echo "🎉 Deploy concluído!"
echo "🌐 Frontend: http://$(curl -s ifconfig.me)"
echo "🔧 Backend: http://$(curl -s ifconfig.me):3000"
echo ""
echo "📊 Comandos úteis:"
echo "  Ver logs: docker-compose -f docker-compose.prod.yml logs -f [frontend|backend]"
echo "  Parar: docker-compose -f docker-compose.prod.yml down"
echo "  Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo "  Status: docker-compose -f docker-compose.prod.yml ps"