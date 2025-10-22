# 🔑 GUIA PARA PREENCHER O .env

# ============================================
# SUBSTITUA ESTES VALORES PELOS SEUS REAIS:
# ============================================

# 1️⃣ SUPABASE (OBRIGATÓRIO)
SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
# Onde encontrar: Supabase Dashboard > Settings > API > Project URL

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Onde encontrar: Supabase Dashboard > Settings > API > anon public

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Onde encontrar: Supabase Dashboard > Settings > API > service_role (secret)

# 2️⃣ DOMÍNIO (OBRIGATÓRIO EM PRODUÇÃO)
APP_DOMAIN=meusite.com.br
# Substitua pelo SEU domínio real

# 3️⃣ SEGURANÇA (OBRIGATÓRIO)
JWT_SECRET=uma_string_super_secreta_de_pelo_menos_32_caracteres_aleatórios
# Crie uma senha forte única

CORS_ORIGIN=https://meusite.com.br
# Mesmo domínio acima, com https://

# 4️⃣ CLOUDFLARE (OPCIONAL)
CLOUDFLARE_ZONE_ID=abc123def456
# Só se usar Cloudflare: Dashboard > domínio > Zone ID

CLOUDFLARE_API_TOKEN=xyz789
# Só se usar Cloudflare: My Profile > API Tokens

# ============================================
# ESTES PODEM FICAR ASSIM:
# ============================================
NODE_ENV=production
PORT=3000