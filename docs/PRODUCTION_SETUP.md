# Production setup (DigitalOcean) — adminimobiliaria.site

Este documento descreve os passos e arquivos que preparamos no repositório para subir o ambiente de produção no DigitalOcean (Droplet). Ele assume que você já tem acesso SSH ao droplet.

Checklist rápido
- Criar DNS (wildcard ou subdomínio específico) apontando para o droplet
- Copiar os arquivos `deploy/nginx/adminimobiliaria.site.conf` para `/etc/nginx/sites-available/` e habilitar
- Ajustar variáveis de ambiente (copiar `.env.example` para local apropriado)
- Instalar e configurar Node (versão 18+), PM2 ou systemd unit
- Criar certificados TLS (certbot DNS-01 para wildcard ou cert per host)

Arquivos adicionados no repositório
- `deploy/nginx/adminimobiliaria.site.conf` — exemplo de configuração nginx
- `backend/src/middleware/tenantMiddleware.ts` — middleware para resolver tenant pelo Host
- `backend/src/routes/debug.ts` — rota de debug para listar tenants (proteja ou remova em produção)
- `backend/.env.example` e `frontend/.env.example` — exemplos de variáveis de ambiente
- `deploy/adminimobiliaria-backend.service` — exemplo de unit file systemd para o backend

Passo-a-passo resumido

1. Atualize DNS

- Para produzir subdomínios dinâmicos, crie um wildcard (recomendado):
  - Tipo: A
  - Nome: *
  - Valor: <IP do droplet>

2. Nginx

- Copie o arquivo de exemplo para o droplet:
  ```bash
  sudo cp deploy/nginx/adminimobiliaria.site.conf /etc/nginx/sites-available/adminimobiliaria.site
  sudo ln -s /etc/nginx/sites-available/adminimobiliaria.site /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
  ```

3. Variáveis de ambiente

- No backend, crie `/var/www/adminimobiliaria/backend/.env` com os valores reais (veja `backend/.env.example`).
- No frontend, durante o build, defina `NEXT_PUBLIC_API_URL` apontando para a URL pública (ex: https://adminimobiliaria.site).

4. Backend (deploy)

- Exemplo com systemd (copie `deploy/adminimobiliaria-backend.service` para `/etc/systemd/system/`):
  ```bash
  sudo cp deploy/adminimobiliaria-backend.service /etc/systemd/system/adminimobiliaria-backend.service
  sudo systemctl daemon-reload
  sudo systemctl enable --now adminimobiliaria-backend.service
  sudo journalctl -u adminimobiliaria-backend.service -f
  ```

5. SSL/TLS

- Wildcard cert preferencial: utilize DNS-01 (plugin do provedor) para emitir `*.adminimobiliaria.site`.
- Se optar por cert por host use `certbot --nginx -d adminimobiliaria.site -d www.adminimobiliaria.site` e repita para subdomínios ou configure DNS-01.

6. Testes

- Super admin: https://adminimobiliaria.site/admin
- Tenant vitrine: https://danierick.adminimobiliaria.site
- Tenant painel: https://danierick.painel.adminimobiliaria.site

Debug útil (após backend ativo)

- Endpoint de debug criado: `GET /api/debug/tenants` — use para listar tenants enquanto testa. IMPORTANTE: restrinja esse endpoint em produção (IP allowlist / basic auth) ou remova após testes.

Observações

- Ajuste o import `Tenant` nos arquivos em `backend/src/*` conforme a sua camada de dados (Sequelize / TypeORM / Prisma). Os arquivos adicionados supõem métodos `findOne` / `findAll` para leitura.
- Cookies: para compartilhar sessão entre subdomínios defina cookie domain como `.adminimobiliaria.site`.
- Faça backup do banco antes de rodar testes que possam alterar dados.
