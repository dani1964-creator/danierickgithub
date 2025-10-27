#!/bin/bash
# Script para corrigir deployment de produção na Digital Ocean

echo "🚀 Iniciando correção do deployment de produção..."

# 1. Corrigir nginx.conf para suportar rotas do SPA corretamente
echo "📝 Corrigindo configuração do Nginx..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logs
    access_log  /var/log/nginx/access.log;
    error_log   /var/log/nginx/error.log;
    
    # Configurações de performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    
    # Compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    server {
        listen 80;
        server_name adminimobiliaria.site *.adminimobiliaria.site;
        root /usr/share/nginx/html;
        index index.html;
        
        # CORREÇÃO: Configuração específica para SPA - TODAS as rotas devem ir para index.html
        location / {
            try_files $uri $uri/ @fallback;
        }
        
        # Fallback para SPA - redireciona tudo para index.html
        location @fallback {
            rewrite ^.*$ /index.html last;
        }
        
        # Rotas específicas do sistema - garantir que funcionem
        location ~ ^/(admin|super|diagnostico|setup-broker|dashboard|auth|debug) {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Configuração de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        
        # Headers para CORS se necessário
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range" always;
        
        # Responder OPTIONS para CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin '*';
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
}
EOF

# 2. Atualizar Dockerfile.frontend para garantir build correto
echo "🐳 Atualizando Dockerfile frontend..."
cat > Dockerfile.frontend << 'EOF'
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar arquivos do projeto
COPY . .

# Build da aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Remover configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nossa configuração customizada
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# 3. Criar script de deploy atualizado
echo "📦 Criando script de deploy atualizado..."
cat > deploy-production-fixed.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Iniciando deploy para produção na Digital Ocean..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker."
    exit 1
fi

# Parar containers existentes
echo "⏹️ Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down || true

# Limpar imagens antigas (opcional)
echo "🧹 Limpando imagens antigas..."
docker system prune -f

# Build e start dos containers
echo "🔨 Fazendo build dos containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
echo "📊 Verificando status dos containers..."
sleep 10
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em:"
echo "   - http://adminimobiliaria.site"
echo "   - http://adminimobiliaria.site/admin"
echo "   - http://danierick.adminimobiliaria.site"

# Verificar logs se houver problemas
echo "📋 Para verificar logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
EOF

chmod +x deploy-production-fixed.sh

# 4. Criar arquivo de configuração para environment
echo "⚙️ Criando arquivo de exemplo de variáveis de ambiente..."
cat > .env.production.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Super Admin Credentials
VITE_SA_EMAIL=admin@yourcompany.com
VITE_SA_PASSWORD=your-secure-password

# Production Environment
NODE_ENV=production
VITE_APP_ENV=production

# Optional: Analytics and monitoring
VITE_GA_TRACKING_ID=
VITE_HOTJAR_ID=
EOF

# 5. Testar build local antes do deploy
echo "🔧 Testando build local..."
npm run build

echo "✅ Correções aplicadas com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas variáveis de ambiente no .env"
echo "2. Execute: ./deploy-production-fixed.sh"
echo "3. Verifique se os domínios estão apontando para o IP correto"
echo ""
echo "🐛 Para debug:"
echo "- Logs do nginx: docker exec -it container_name cat /var/log/nginx/error.log"
echo "- Logs da aplicação: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🌐 Rotas que devem funcionar:"
echo "- adminimobiliaria.site (página inicial)"
echo "- adminimobiliaria.site/admin (painel administrativo)" 
echo "- adminimobiliaria.site/dashboard (dashboard)"
echo "- danierick.adminimobiliaria.site (site público)"