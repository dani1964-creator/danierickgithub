Public site — testes locais e diagnóstico

Este arquivo descreve passos rápidos para testar e diagnosticar o public-site localmente.

1) Como iniciar o dev server

Abra um terminal e execute:

```bash
cd frontend
npm run dev
```

O Next irá escolher a porta 3000 (ou 3001 se 3000 estiver em uso). Observe a saída para ver a porta usada.

2) Testar qual broker é resolvido para um Host

Use o endpoint diagnóstico que foi adicionado: `/api/debug-tenant`.
Ele aceita o header `Host:` para simular um tenant/subdomain. Para forçar a resolução local (sem depender da Edge Function) use `?force_local=1`.

Exemplo:

```bash
curl -v -H "Host: danierick.adminimobiliaria.site" "http://127.0.0.1:3001/api/debug-tenant?force_local=1" | jq .
```

Resposta esperada (ex):

{
  "ok": true,
  "broker": { "website_slug": "danierick", "site_favicon_url": "...", "logo_url": "..." },
  "host": "danierick.adminimobiliaria.site",
  "resolution_method": "local"
}

Se retornar 404, verifique:
- Se o broker com `website_slug` existe na instância do Supabase apontada por `frontend/integrations/supabase/client.ts`.
- Se há registro em `broker_domains` para um domínio customizado.

3) Testar página pública / detalhe do imóvel

Abra no navegador apontando o Host correto (mapear em `/etc/hosts` para `127.0.0.1`) ou use curl com header Host. Se quiser testar uma rota de detalhe do imóvel, a `middleware` do projeto rewrite mapas de `/` do subdomínio para `/public-site` e deep-links do tipo `/{propertySlug}` são reescritos para `public-site?propertySlug=...`.

Exemplo com Host header:

```bash
curl -v -H "Host: danierick.adminimobiliaria.site" "http://127.0.0.1:3001/public-site?propertySlug=meu-imovel" 
```

4) Notas sobre comportamento em dev vs prod

- Em desenvolvimento (`NODE_ENV !== 'production'`) o `BrokerResolver` prioriza a resolução local (consulta direta ao Supabase). Em produção a resolução tenta (se configurada) a Edge Function `host-to-broker` e faz fallback local.
- O endpoint `/api/debug-tenant?force_local=1` força resolução local independentemente do ambiente.

5) Limpeza e melhorias recomendadas

- Substituir usos manuais de `window.location.origin`/`href` por `getPublicUrl`/`getPropertyUrl` para evitar links com `undefined` e garantir consistência entre subdomínios e domínios customizados.
- Garantir que servidores/proxies forwards os headers `Host` e `X-Forwarded-Host` para que a resolução funcione em produção.

6) Contatos

Se precisar, eu posso:
- Fazer a varredura automática para trocar os usos manuais por `getPropertyUrl` nos arquivos ativos (`frontend/`) e rodar `npx tsc --noEmit` + `npm run build`.
- Criar teste unitário rápido para o `BrokerResolver` (mock Supabase) — requer configuração adicional.

---
Gerado automaticamente durante a sessão de diagnóstico para facilitar teste local rápido.
