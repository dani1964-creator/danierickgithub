# Multi-stage Dockerfile para o projeto completo

# ============================================
# STAGE 1: Build do Frontend (React + Vite)
# ============================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependência do frontend
COPY package*.json pnpm-lock.yaml ./
COPY frontend/package*.json ./frontend/

# Instalar dependências
RUN pnpm install

# Copiar código fonte
COPY . .

# Build da aplicação frontend
RUN pnpm build

# ============================================
# STAGE 2: Build do Backend (Node.js + TypeScript)
# ============================================
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copiar arquivos do backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copiar código fonte do backend
COPY backend/ .

# Build do TypeScript
RUN npm run build

# ============================================
# STAGE 3: Nginx para Frontend + Proxy para Backend
# ============================================
FROM nginx:alpine AS production

# Instalar Node.js para o backend
RUN apk add --no-cache nodejs npm

# Copiar build do frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copiar backend buildado
COPY --from=backend-builder /app /app/backend

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Criar script de inicialização
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'cd /app/backend && npm start &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80 3000

CMD ["/start.sh"]