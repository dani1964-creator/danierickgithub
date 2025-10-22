#!/bin/bash

# 🚀 Deploy Rápido para Digital Ocean
# Execute: curl -sSL https://raw.githubusercontent.com/dani1964-creator/danierickgithub/main/deploy-production.sh | bash

set -e

echo "🚀 Deploy Automático - Digital Ocean + Supabase + Cloudflare"
echo "============================================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Execute o script novamente após logout/login."
    exit 0
fi

# Verificar se Docker Compose está disponível
if ! docker compose version &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Clonar repositório (se não existir)
if [ ! -d "danierickgithub" ]; then
    echo "📥 Clonando repositório..."
    git clone https://github.com/dani1964-creator/danierickgithub.git
    cd danierickgithub
else
    echo "📥 Atualizando repositório..."
    cd danierickgithub
    git pull origin main
fi

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo "⚙️ Criando arquivo .env..."
    cp .env.example .env
    echo "📝 IMPORTANTE: Configure suas variáveis em .env"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    read -p "Pressione Enter após configurar o .env..."
fi

# Parar containers antigos
echo "⏹️ Parando containers antigos..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build e start
echo "🔨 Construindo e iniciando aplicação..."
docker compose -f docker-compose.prod.yml up --build -d

# Verificar status
echo "✅ Verificando status..."
docker compose -f docker-compose.prod.yml ps

# Mostrar informações
echo ""
echo "🎉 Deploy concluído!"
echo "🌐 Acesse: http://$(curl -s ifconfig.me 2>/dev/null || echo 'SEU-IP')"
echo ""
echo "📊 Comandos úteis:"
echo "  Logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  Parar: docker compose -f docker-compose.prod.yml down"
echo "  Restart: docker compose -f docker-compose.prod.yml restart"
echo ""
echo "🔧 Próximos passos:"
echo "1. Configure DNS no Cloudflare apontando para este IP"
echo "2. Adicione domínios personalizados no dashboard"
echo "3. Configure SSL/TLS no Cloudflare (Full Strict)"