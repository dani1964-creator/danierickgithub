# Deploy Configuration for DigitalOcean App Platform

## Configuração Automática via app.yaml

Este projeto usa `.do/app.yaml` para configuração automática.

### Build Settings (já configurado no app.yaml)

```yaml
source_dir: /frontend
build_command: npm ci && npm run build
run_command: npm start
http_port: 3000
```

### Environment Variables (Configure no Dashboard DO)

**Obrigatórias:**
```
NEXT_PUBLIC_BASE_PUBLIC_DOMAIN=adminimobiliaria.site
NEXT_PUBLIC_APP_URL=https://adminimobiliaria.site
NEXT_PUBLIC_CNAME_TARGET=adminimobiliaria.site
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Deploy via GitHub

1. Conecte o repositório GitHub ao DigitalOcean
2. App Platform detectará automaticamente `.do/app.yaml`
3. Configure as variáveis de ambiente no dashboard
4. Deploy será automático a cada push para `main`

### Estrutura do Projeto

```
/
├── .do/
│   └── app.yaml          ← Configuração DO App Platform
├── frontend/             ← Aplicação Next.js
│   ├── pages/
│   ├── package.json
│   ├── next.config.js
│   ├── Procfile          ← Comando de execução
│   └── ...
└── ...
```

### Troubleshooting

**Erro: "Cannot find module"**
- Verifique se `source_dir: /frontend` está correto
- Verifique se `build_command` inclui `npm ci`

**Erro: "Port already in use"**
- Certifique-se que `http_port: 3000` está definido
- Next.js usa porta 3000 por padrão

**Build muito lento**
- Use `npm ci` ao invés de `npm install`
- Cache de node_modules é automático no DO

### Links Úteis

- [DigitalOcean App Spec](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
