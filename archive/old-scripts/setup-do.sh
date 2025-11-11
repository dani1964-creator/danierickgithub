#!/bin/bash

# Script completo de setup no Digital Ocean
# Execute: curl -sSL https://raw.githubusercontent.com/SEU-USUARIO/SEU-REPO/main/setup-do.sh | bash

set -e

echo "🚀 Setup completo Digital Ocean + Cloudflare"
echo "=============================================="

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Execute como root: sudo bash setup-do.sh"
    exit 1
fi

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update -y
apt upgrade -y

# Instalar dependências básicas
echo "🛠️ Instalando dependências..."
apt install -y git curl wget nginx certbot python3-certbot-nginx ufw

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Instalar Docker Compose
echo "🔧 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Criar usuário deploy
echo "👤 Criando usuário deploy..."
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Configurar diretório do projeto
PROJECT_DIR="/home/deploy/app"
mkdir -p $PROJECT_DIR
chown deploy:deploy $PROJECT_DIR

echo ""
echo "✅ Setup inicial concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Faça login como usuário deploy: su - deploy"
echo "2. Clone seu repositório: git clone https://github.com/SEU-USUARIO/SEU-REPO.git app"
echo "3. Entre no diretório: cd app"
echo "4. Configure o .env: cp .env.example .env && nano .env"
echo "5. Execute o deploy: ./deploy-simple.sh"
echo "6. Configure SSL: sudo certbot --nginx -d seudominio.com -d www.seudominio.com"
echo ""
echo "🌐 IP deste servidor: $(curl -s ifconfig.me)"
echo "📝 Configure este IP nos DNS records do Cloudflare"