# 🎯 Como Obter o DO_APP_ID (Método Manual - Mais Simples)

## Método 1: Pela URL do App (MAIS FÁCIL) ⭐

1. Acesse: https://cloud.digitalocean.com/apps

2. Clique no app **whale-app**

3. Olhe a URL do navegador, ela será algo como:
   ```
   https://cloud.digitalocean.com/apps/c9a1a9c8-1234-5678-9abc-def012345678/settings
   ```

4. Copie o ID (a parte entre `/apps/` e `/settings`):
   ```
   c9a1a9c8-1234-5678-9abc-def012345678
   ```

5. Esse é o seu `DO_APP_ID`! 🎉

## Adicionar no Digital Ocean App Platform

### Passo a Passo com Screenshots:

1. **Acesse:** https://cloud.digitalocean.com/apps

2. **Clique em:** whale-app

3. **Navegue para:** Settings (menu lateral esquerdo)

4. **Role até:** App-Level Environment Variables

5. **Clique em:** Edit

6. **Adicione nova variável:**
   - Click em "Add Variable" ou no ícone "+"
   - Key: `DO_APP_ID`
   - Value: `cole_o_id_que_voce_copiou_da_url`
   - Type: Plain Text (NÃO marcar "Encrypt")
   - Scope: `RUN_AND_BUILD_TIME`

7. **Clique em:** Save

8. **Aguarde:** O app será redeployado (1-2 minutos)

## ✅ Pronto! Agora teste

### Teste se está funcionando:

Aguarde o deploy terminar, depois execute:

```bash
curl -X POST https://whale-app-w84mh.ondigitalocean.app/api/domains/do-add-to-app \
  -H "Content-Type: application/json" \
  -d '{"domain":"imobideps.com"}'
```

### Resposta esperada:

```json
{
  "success": true,
  "message": "Domain added to App Platform successfully",
  "domain": "imobideps.com",
  "www": "www.imobideps.com",
  "note": "SSL certificate will be provisioned automatically by Let's Encrypt (5-15 minutes)"
}
```

### Se der erro:

```json
{
  "error": "Digital Ocean credentials not configured",
  "details": "DO_ACCESS_TOKEN or DO_APP_ID missing"
}
```

**Solução:** Verifique se salvou a variável corretamente e aguarde o deploy completar.

## 🎯 Visual do que você verá

### Na URL:
```
https://cloud.digitalocean.com/apps/[ESTE_É_O_SEU_DO_APP_ID]/settings
                                    └─────────────────────────┘
                                    Copie esta parte!
```

### No painel de variáveis:
```
┌─────────────────────────────────────────────────────┐
│ App-Level Environment Variables                     │
├─────────────────────────────────────────────────────┤
│ Key: DO_APP_ID                                      │
│ Value: c9a1a9c8-1234-5678-9abc-def012345678        │
│ Encrypted: ☐ (deixe desmarcado)                    │
│ Scope: RUN_AND_BUILD_TIME                          │
└─────────────────────────────────────────────────────┘
```

## 📝 Exemplo Real

Seu app ID provavelmente se parece com um destes formatos:
- `c9a1a9c8-1234-5678-9abc-def012345678` (UUID completo)
- `1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6` (UUID completo)

É sempre um UUID (formato: 8-4-4-4-12 caracteres separados por hífens)

## ❓ FAQ

**P: O DO_APP_ID é segredo?**
R: Não precisa criptografar, é apenas um identificador.

**P: Preciso adicionar no frontend também?**
R: Não! Apenas App-Level Environment Variables (nível do app).

**P: Quanto tempo para funcionar após salvar?**
R: ~1-2 minutos (tempo de redeploy do app).

**P: Como saber se está funcionando?**
R: Execute o comando curl acima. Se retornar `"success": true`, está OK!

**P: E se eu não conseguir ver a URL completa?**
R: Clique em Settings, depois copie a URL da barra de endereços do navegador.

## 🚀 Próximos Passos

Após configurar o `DO_APP_ID`:

1. ✅ Sistema verificará nameservers automaticamente (cron a cada 5 min)
2. ✅ Quando verificado, adicionará domínio ao App Platform via API
3. ✅ Digital Ocean provisionará SSL Let's Encrypt automaticamente
4. ✅ Cliente terá HTTPS funcionando em ~15-30 minutos após configurar nameservers

**Você não precisa fazer mais nada! 🎉**

---

**Dúvidas?** Veja a documentação completa em `docs/AUTOMACAO_SSL_COMPLETA.md`
