# 🌐 Migração Digital Ocean → Cloudflare DNS - PARTE 2

## 📋 Índice desta Parte

**PARTE 2 (Este arquivo):**
6. [Migração: Passo a Passo Detalhado](#migracao)
7. [Implementação de Código](#codigo)
8. [Configuração do Cliente](#cliente)
9. [Compatibilidade e Adaptações](#compatibilidade)

**PARTE 3 (Próximo arquivo):**
10. Testes e Validação
11. Rollback Plan
12. FAQ e Troubleshooting

---

<a name="migracao"></a>
## 🔄 6. Migração: Passo a Passo Detalhado

### 6.1 Fase 1: Preparação (2-4 horas)

#### Etapa 1.1: Criar Conta Cloudflare

```bash
# 1. Acesse: https://dash.cloudflare.com/sign-up
# 2. Preencha:
#    - Email: seu@email.com
#    - Senha: (mínimo 8 caracteres)
# 3. Verificar email
# 4. Login: https://dash.cloudflare.com/login
```

**Resultado esperado:**
- ✅ Conta criada
- ✅ Email verificado
- ✅ Dashboard acessível

#### Etapa 1.2: Obter Credenciais

**A) Account ID:**

```bash
# 1. No dashboard: https://dash.cloudflare.com/
# 2. Clique em qualquer domínio (ou Workers & Pages)
# 3. Barra lateral direita → "Account ID"
# 4. Copiar (ex: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6)
```

**B) API Token:**

```bash
# 1. Acesse: https://dash.cloudflare.com/profile/api-tokens
# 2. Clique em "Create Token"
# 3. Use template: "Edit zone DNS"
# 4. Configurar:
#    - Permissions:
#      * Zone - DNS - Edit
#      * Zone - Zone - Read
#      * Zone - Zone Settings - Edit
#    - Zone Resources:
#      * Include - All zones
#    - IP Address Filtering: (deixe vazio)
#    - TTL: (deixe vazio = sem expiração)
# 5. Clique "Continue to summary"
# 6. Clique "Create Token"
# 7. COPIE O TOKEN (só aparece uma vez!)
```

**Resultado esperado:**
```
Token: sampleToken_12345abcde-ABCDE67890fghij
Account ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### Etapa 1.3: Configurar Variáveis de Ambiente

**Digital Ocean App Platform:**

```bash
# 1. Acesse: https://cloud.digitalocean.com/apps
# 2. Clique em "whale-app"
# 3. Settings → App-Level Environment Variables
# 4. Clique "Edit"
# 5. Adicionar:

# Cloudflare (NOVO)
CLOUDFLARE_API_TOKEN=seu_token_aqui
CLOUDFLARE_ACCOUNT_ID=seu_account_id
DNS_PROVIDER=digitalocean  # Mantenha DO por enquanto

# Digital Ocean (MANTER para rollback)
DO_ACCESS_TOKEN=...  # Já existe
DO_APP_ID=...        # Já existe

# 6. Clique "Save"
# 7. Aguardar redeploy (~2-3 minutos)
```

**Local (.env.local para testes):**

```bash
# Criar arquivo para desenvolvimento:
cat > /workspaces/danierickgithub/.env.local << 'ENVEOF'
# Cloudflare
CLOUDFLARE_API_TOKEN=seu_token_aqui
CLOUDFLARE_ACCOUNT_ID=seu_account_id
DNS_PROVIDER=cloudflare

# Supabase (já existe)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Cron
CRON_SECRET_TOKEN=...
ENVEOF
```

#### Etapa 1.4: Validar Credenciais

**Teste via curl:**

```bash
# Testar API token Cloudflare:
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"

# Resposta esperada:
# {
#   "success": true,
#   "result": {
#     "id": "...",
#     "status": "active"
#   }
# }
```

**Testar criar zona (dry-run):**

```bash
# Criar zona de teste:
curl -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "test-domain-123.com",
    "account": {"id": "'$CLOUDFLARE_ACCOUNT_ID'"},
    "jump_start": true
  }'

# Se retornar erro 1061 (domain exists): OK, API funciona!
# Se retornar success: OK, zona criada! (pode deletar depois)
```

---

### 6.2 Fase 2: Desenvolvimento (15-20 horas)

#### Etapa 2.1: Estrutura de Arquivos

```bash
# Criar estrutura:
mkdir -p frontend/pages/api/domains
mkdir -p frontend/lib

# Arquivos a criar:
# frontend/pages/api/domains/
#   ├── cf-create-zone.ts       (novo)
#   ├── cf-verify.ts             (novo)
#   ├── cf-delete-zone.ts        (novo)
#   ├── cf-purge-cache.ts        (novo)
#   ├── do-create-zone.ts        (manter)
#   └── do-add-to-app.ts         (manter)
#
# frontend/pages/api/cron/
#   └── verify-nameservers.ts    (modificar)
#
# frontend/lib/
#   └── cloudflare.ts            (novo - helper functions)
```

#### Etapa 2.2: Criar Arquivo Helper (Cloudflare)

**Arquivo:** `frontend/lib/cloudflare.ts`

```typescript
/**
 * Helper functions para Cloudflare API
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface CloudflareConfig {
  apiToken: string;
  accountId: string;
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  name_servers: string[];
  created_on: string;
}

export interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

/**
 * Criar zona no Cloudflare
 */
export async function createCloudflareZone(
  domain: string,
  config: CloudflareConfig
): Promise<{ zone: CloudflareZone; error?: string }> {
  try {
    const response = await fetch(`${CF_API_BASE}/zones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        account: { id: config.accountId },
        jump_start: true, // Auto-detecta registros existentes
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        zone: null as any, 
        error: data.errors?.[0]?.message || 'Failed to create zone' 
      };
    }

    return { zone: data.result };
  } catch (error) {
    return { 
      zone: null as any, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Adicionar registro DNS
 */
export async function createDNSRecord(
  zoneId: string,
  record: {
    type: string;
    name: string;
    content: string;
    proxied?: boolean;
    ttl?: number;
  },
  config: CloudflareConfig
): Promise<{ record: CloudflareDNSRecord; error?: string }> {
  try {
    const response = await fetch(`${CF_API_BASE}/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        proxied: record.proxied ?? true, // Default: proxy ON
        ttl: record.ttl ?? 1, // Auto
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        record: null as any, 
        error: data.errors?.[0]?.message || 'Failed to create record' 
      };
    }

    return { record: data.result };
  } catch (error) {
    return { 
      record: null as any, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Obter status da zona
 */
export async function getZoneStatus(
  zoneId: string,
  config: CloudflareConfig
): Promise<{ zone: CloudflareZone; error?: string }> {
  try {
    const response = await fetch(`${CF_API_BASE}/zones/${zoneId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        zone: null as any, 
        error: data.errors?.[0]?.message || 'Failed to get zone' 
      };
    }

    return { zone: data.result };
  } catch (error) {
    return { 
      zone: null as any, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Deletar zona
 */
export async function deleteZone(
  zoneId: string,
  config: CloudflareConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CF_API_BASE}/zones/${zoneId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        success: false, 
        error: data.errors?.[0]?.message || 'Failed to delete zone' 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Configurar SSL mode
 */
export async function configureSSL(
  zoneId: string,
  mode: 'off' | 'flexible' | 'full' | 'full_strict',
  config: CloudflareConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CF_API_BASE}/zones/${zoneId}/settings/ssl`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: mode }),
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        success: false, 
        error: data.errors?.[0]?.message || 'Failed to configure SSL' 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Ativar Always Use HTTPS
 */
export async function enableAlwaysHTTPS(
  zoneId: string,
  config: CloudflareConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${CF_API_BASE}/zones/${zoneId}/settings/always_use_https`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: 'on' }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      return { 
        success: false, 
        error: data.errors?.[0]?.message || 'Failed to enable HTTPS redirect' 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Purge cache (limpar cache do CDN)
 */
export async function purgeCache(
  zoneId: string,
  config: CloudflareConfig,
  options?: { files?: string[]; tags?: string[]; hosts?: string[] }
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = options?.files 
      ? { files: options.files }
      : options?.tags
      ? { tags: options.tags }
      : options?.hosts
      ? { hosts: options.hosts }
      : { purge_everything: true };

    const response = await fetch(`${CF_API_BASE}/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        success: false, 
        error: data.errors?.[0]?.message || 'Failed to purge cache' 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

#### Etapa 2.3: Criar Endpoint de Criação de Zona

**Arquivo:** `frontend/pages/api/domains/cf-create-zone.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { cleanDomain, isValidDomain, DomainErrors } from '@/lib/domainUtils';
import {
  createCloudflareZone,
  createDNSRecord,
  configureSSL,
  enableAlwaysHTTPS,
  type CloudflareConfig,
} from '@/lib/cloudflare';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const APP_DOMAIN = 'whale-app-w84mh.ondigitalocean.app';

/**
 * API para criar zona DNS no Cloudflare
 * 
 * POST /api/domains/cf-create-zone
 * Body: { brokerId: string, domain: string }
 * 
 * Fluxo:
 * 1. Cria zona no Cloudflare
 * 2. Adiciona registros CNAME (proxied)
 * 3. Configura SSL + HTTPS redirect
 * 4. Salva no banco com metadata
 * 5. Retorna nameservers
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CF_TOKEN || !CF_ACCOUNT_ID) {
    return res.status(503).json({ 
      error: 'Cloudflare not configured',
      details: 'CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID missing'
    });
  }

  try {
    const { brokerId, domain } = req.body;

    if (!brokerId || !domain) {
      return res.status(400).json({ error: 'Broker ID and domain are required' });
    }

    // Normalizar e validar domínio
    const normalizedDomain = cleanDomain(domain);
    
    if (!isValidDomain(normalizedDomain)) {
      return res.status(400).json({ error: DomainErrors.INVALID_FORMAT });
    }

    console.log(`[CF] Creating zone for: ${normalizedDomain}`);

    // Verificar se broker existe
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('id', brokerId)
      .single();

    if (brokerError || !broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Verificar se domínio já existe no banco
    const { data: existingZone } = await supabase
      .from('dns_zones')
      .select('*')
      .eq('domain', normalizedDomain)
      .single();

    if (existingZone) {
      console.log(`[CF] Zone already exists: ${normalizedDomain}`);
      return res.status(200).json({ 
        success: true,
        zoneId: existingZone.id,
        domain: existingZone.domain,
        status: existingZone.status,
        nameservers: existingZone.nameservers,
        message: 'Domain already configured'
      });
    }

    const config: CloudflareConfig = {
      apiToken: CF_TOKEN,
      accountId: CF_ACCOUNT_ID,
    };

    // 1. Criar zona no Cloudflare
    console.log(`[CF] Creating Cloudflare zone...`);
    const { zone, error: zoneError } = await createCloudflareZone(
      normalizedDomain,
      config
    );

    if (zoneError || !zone) {
      console.error(`[CF] Failed to create zone:`, zoneError);
      return res.status(500).json({ 
        error: 'Failed to create Cloudflare zone',
        details: zoneError
      });
    }

    console.log(`[CF] Zone created: ${zone.id}, status: ${zone.status}`);

    // 2. Adicionar registros CNAME (root, www, wildcard)
    const records = [
      { type: 'CNAME', name: '@', content: APP_DOMAIN, proxied: true },
      { type: 'CNAME', name: 'www', content: APP_DOMAIN, proxied: true },
      { type: 'CNAME', name: '*', content: APP_DOMAIN, proxied: true },
    ];

    console.log(`[CF] Adding DNS records...`);
    for (const record of records) {
      const { error: recordError } = await createDNSRecord(zone.id, record, config);
      if (recordError) {
        console.warn(`[CF] Failed to create record ${record.name}:`, recordError);
        // Continua mesmo se falhar (pode já existir)
      }
    }

    // 3. Configurar SSL (Full ou Flexible)
    console.log(`[CF] Configuring SSL...`);
    await configureSSL(zone.id, 'flexible', config); // Flexible = CF-to-origin HTTP OK
    await enableAlwaysHTTPS(zone.id, config);

    // 4. Salvar no banco
    console.log(`[CF] Saving to database...`);
    const { data: dbZone, error: dbError } = await supabase
      .from('dns_zones')
      .insert({
        broker_id: brokerId,
        domain: normalizedDomain,
        status: 'verifying', // Mudará para 'active' quando NS forem configurados
        nameservers: zone.name_servers,
        metadata: {
          provider: 'cloudflare',
          zone_id: zone.id,
          account_id: CF_ACCOUNT_ID,
          created_at: zone.created_on,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[CF] Database error:`, dbError);
      // Tentar deletar zona do Cloudflare (cleanup)
      // await deleteZone(zone.id, config);
      return res.status(500).json({ 
        error: 'Failed to save zone to database',
        details: dbError 
      });
    }

    console.log(`[CF] ✅ Zone created successfully: ${normalizedDomain}`);

    return res.status(200).json({
      success: true,
      zoneId: dbZone.id,
      cfZoneId: zone.id,
      domain: normalizedDomain,
      nameservers: zone.name_servers,
      status: 'verifying',
      message: 'Zone created successfully. Configure nameservers at your registrar.',
      instructions: {
        step1: 'Go to your domain registrar (GoDaddy, Registro.br, etc)',
        step2: 'Find DNS or Nameservers settings',
        step3: 'Change to Custom/Personalized nameservers',
        step4: `Add these nameservers: ${zone.name_servers.join(', ')}`,
        step5: 'Save and wait 5-15 minutes for activation',
      },
    });

  } catch (error) {
    console.error('[CF] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

#### Etapa 2.4: Criar Endpoint de Verificação

**Arquivo:** `frontend/pages/api/domains/cf-verify.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getZoneStatus, type CloudflareConfig } from '@/lib/cloudflare';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * API para verificar status de zona Cloudflare
 * 
 * GET /api/domains/cf-verify?domain=example.com
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CF_TOKEN) {
    return res.status(503).json({ error: 'Cloudflare not configured' });
  }

  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    // Buscar zona no banco
    const { data: dbZone, error: dbError } = await supabase
      .from('dns_zones')
      .select('*')
      .eq('domain', domain)
      .single();

    if (dbError || !dbZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const cfZoneId = dbZone.metadata?.zone_id;
    if (!cfZoneId) {
      return res.status(400).json({ error: 'Not a Cloudflare zone' });
    }

    // Consultar Cloudflare
    const config: CloudflareConfig = {
      apiToken: CF_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    };

    const { zone, error: cfError } = await getZoneStatus(cfZoneId, config);

    if (cfError || !zone) {
      return res.status(500).json({ 
        error: 'Failed to get Cloudflare zone status',
        details: cfError 
      });
    }

    // Atualizar banco se status mudou
    if (zone.status === 'active' && dbZone.status !== 'active') {
      await supabase
        .from('dns_zones')
        .update({ 
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .eq('id', dbZone.id);
    }

    return res.status(200).json({
      success: true,
      domain: zone.name,
      status: zone.status,
      nameservers: zone.name_servers,
      active: zone.status === 'active',
      ssl: zone.status === 'active' ? 'provisioning or active' : 'pending',
    });

  } catch (error) {
    console.error('[CF-VERIFY] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### Etapa 2.5: Criar Endpoint de Remoção

**Arquivo:** `frontend/pages/api/domains/cf-delete-zone.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { deleteZone, type CloudflareConfig } from '@/lib/cloudflare';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * API para deletar zona Cloudflare
 * 
 * DELETE /api/domains/cf-delete-zone
 * Body: { domain: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CF_TOKEN) {
    return res.status(503).json({ error: 'Cloudflare not configured' });
  }

  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Buscar zona no banco
    const { data: dbZone, error: dbError } = await supabase
      .from('dns_zones')
      .select('*')
      .eq('domain', domain)
      .single();

    if (dbError || !dbZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const cfZoneId = dbZone.metadata?.zone_id;
    if (!cfZoneId) {
      return res.status(400).json({ error: 'Not a Cloudflare zone' });
    }

    // Deletar do Cloudflare
    const config: CloudflareConfig = {
      apiToken: CF_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    };

    const { success, error: cfError } = await deleteZone(cfZoneId, config);

    if (!success) {
      console.error('[CF-DELETE] Cloudflare error:', cfError);
      // Continua para deletar do banco mesmo se falhar no CF
    }

    // Deletar do banco (trigger vai limpar custom_domain do broker)
    const { error: deleteError } = await supabase
      .from('dns_zones')
      .delete()
      .eq('id', dbZone.id);

    if (deleteError) {
      return res.status(500).json({ 
        error: 'Failed to delete from database',
        details: deleteError 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Zone deleted successfully',
      domain: domain,
    });

  } catch (error) {
    console.error('[CF-DELETE] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### Etapa 2.6: Criar Endpoint de Purge Cache

**Arquivo:** `frontend/pages/api/domains/cf-purge-cache.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { purgeCache, type CloudflareConfig } from '@/lib/cloudflare';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * API para limpar cache do Cloudflare
 * 
 * POST /api/domains/cf-purge-cache
 * Body: { 
 *   domain: string,
 *   files?: string[],  // URLs específicas
 *   everything?: boolean  // Limpar tudo
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CF_TOKEN) {
    return res.status(503).json({ error: 'Cloudflare not configured' });
  }

  try {
    const { domain, files, everything } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Buscar zona no banco
    const { data: dbZone, error: dbError } = await supabase
      .from('dns_zones')
      .select('*')
      .eq('domain', domain)
      .single();

    if (dbError || !dbZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const cfZoneId = dbZone.metadata?.zone_id;
    if (!cfZoneId) {
      return res.status(400).json({ error: 'Not a Cloudflare zone' });
    }

    // Purge cache
    const config: CloudflareConfig = {
      apiToken: CF_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    };

    const options = files ? { files } : undefined;
    const { success, error: cfError } = await purgeCache(cfZoneId, config, options);

    if (!success) {
      return res.status(500).json({ 
        error: 'Failed to purge cache',
        details: cfError 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cache purged successfully',
      domain: domain,
      purged: everything ? 'everything' : (files?.length || 0) + ' files',
    });

  } catch (error) {
    console.error('[CF-PURGE] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

<a name="codigo"></a>
## 💻 7. Implementação de Código (continuação)

### 7.1 Modificar Cron Job

**Arquivo:** `frontend/pages/api/cron/verify-nameservers.ts`

**Modificações:**

```typescript
// ADICIONAR no início do arquivo:
import { getZoneStatus, type CloudflareConfig } from '@/lib/cloudflare';

// ADICIONAR constantes:
const DNS_PROVIDER = process.env.DNS_PROVIDER || 'cloudflare'; // Feature flag
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// MODIFICAR o loop de verificação:
for (const zone of zones) {
  console.log(`[CRON] Verificando zona: ${zone.domain}`);

  // Detectar provider da zona
  const provider = zone.metadata?.provider || DNS_PROVIDER;

  if (provider === 'cloudflare') {
    // ========================================
    // NOVO: Verificação via Cloudflare API
    // ========================================
    const cfZoneId = zone.metadata?.zone_id;
    
    if (!cfZoneId) {
      console.error(`[CRON] ❌ Zona ${zone.domain} sem zone_id na metadata`);
      continue;
    }

    if (!CF_TOKEN || !CF_ACCOUNT_ID) {
      console.error(`[CRON] ❌ Cloudflare credentials not configured`);
      continue;
    }

    try {
      const config: CloudflareConfig = {
        apiToken: CF_TOKEN,
        accountId: CF_ACCOUNT_ID,
      };

      const { zone: cfZone, error: cfError } = await getZoneStatus(cfZoneId, config);

      if (cfError || !cfZone) {
        console.error(`[CRON] ⚠️ Erro ao consultar Cloudflare:`, cfError);
        
        // Incrementar tentativas
        const newAttempts = zone.verification_attempts + 1;
        const newStatus = newAttempts >= 288 ? 'failed' : 'verifying';

        await supabase
          .from('dns_zones')
          .update({
            status: newStatus,
            last_verification_at: new Date().toISOString(),
            verification_attempts: newAttempts
          })
          .eq('id', zone.id);

        if (newStatus === 'failed') {
          failedCount++;
        }
        continue;
      }

      // Verificar se zona está ativa
      if (cfZone.status === 'active') {
        console.log(`[CRON] ✅ Zona ${zone.domain} verificada (Cloudflare)!`);

        const { error: updateError } = await supabase
          .from('dns_zones')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            last_verification_at: new Date().toISOString(),
            verification_attempts: zone.verification_attempts + 1
          })
          .eq('id', zone.id);

        if (updateError) {
          console.error(`[CRON] Erro ao atualizar zona ${zone.domain}:`, updateError);
        } else {
          verifiedCount++;
          
          // Cloudflare já provisiona SSL automaticamente!
          // Não precisa adicionar ao App Platform
          console.log(`[CRON] 🔒 SSL já está sendo provisionado pelo Cloudflare`);
        }
      } else {
        // Zona ainda pendente (nameservers não configurados)
        console.log(`[CRON] ⏳ Zona ${zone.domain} ainda pendente (status: ${cfZone.status})`);
        
        const newAttempts = zone.verification_attempts + 1;
        const newStatus = newAttempts >= 288 ? 'failed' : 'verifying';

        await supabase
          .from('dns_zones')
          .update({
            status: newStatus,
            last_verification_at: new Date().toISOString(),
            verification_attempts: newAttempts
          })
          .eq('id', zone.id);

        if (newStatus === 'failed') {
          failedCount++;
        }
      }

    } catch (error) {
      console.error(`[CRON] Erro ao verificar zona ${zone.domain}:`, error);
    }

  } else {
    // ========================================
    // EXISTENTE: Verificação Digital Ocean
    // ========================================
    // ... manter código atual (Google DNS API) ...
    
    try {
      const dnsResponse = await fetch(
        `https://dns.google/resolve?name=${zone.domain}&type=NS`
      );
      const dnsData = await dnsResponse.json();

      // ... resto do código atual ...
      
      if (hasDigitalOceanNS) {
        console.log(`[CRON] ✅ Zona ${zone.domain} verificada (Digital Ocean)!`);

        const { error: updateError } = await supabase
          .from('dns_zones')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            last_verification_at: new Date().toISOString(),
            verification_attempts: zone.verification_attempts + 1
          })
          .eq('id', zone.id);

        if (updateError) {
          console.error(`[CRON] Erro ao atualizar zona ${zone.domain}:`, updateError);
        } else {
          verifiedCount++;
          
          // Digital Ocean: Adicionar ao App Platform para SSL
          try {
            console.log(`[CRON] 🔒 Adicionando ${zone.domain} ao App Platform...`);
            
            const addDomainResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL || 'https://whale-app-w84mh.ondigitalocean.app'}/api/domains/do-add-to-app`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: zone.domain }),
              }
            );

            if (addDomainResponse.ok) {
              const result = await addDomainResponse.json();
              console.log(`[CRON] ✅ Domínio adicionado ao App Platform`);
            } else {
              const error = await addDomainResponse.json();
              console.error(`[CRON] ⚠️ Erro ao adicionar ao App Platform:`, error);
            }
          } catch (appError) {
            console.error(`[CRON] ⚠️ Falha ao adicionar ${zone.domain}:`, appError);
          }
        }
      } else {
        // ... resto do código atual ...
      }
    } catch (error) {
      console.error(`[CRON] Erro ao verificar zona ${zone.domain}:`, error);
    }
  }

  // Pequeno delay entre verificações
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

---

<a name="cliente"></a>
## 👥 8. Configuração do Cliente

### 8.1 UI Components (Adaptações)

**Arquivo:** `frontend/components/domains/DNSManager.tsx`

**Modificações mínimas:**

```typescript
// ANTES:
const nameservers = [
  'ns1.digitalocean.com',
  'ns2.digitalocean.com',
  'ns3.digitalocean.com'
];

// DEPOIS:
const nameservers = zone.nameservers || [
  'ns1.digitalocean.com',
  'ns2.digitalocean.com',
  'ns3.digitalocean.com'
];

// Renderização adaptativa:
<div className="nameservers">
  <h3>Configure estes nameservers no seu registrador:</h3>
  {nameservers.map((ns, index) => (
    <div key={index} className="nameserver-item">
      <code>{ns}</code>
      <button onClick={() => copyToClipboard(ns)}>Copiar</button>
    </div>
  ))}
  
  {zone.metadata?.provider === 'cloudflare' && (
    <div className="cloudflare-badge">
      <span>🟠 Cloudflare CDN + Security Enabled</span>
    </div>
  )}
</div>
```

### 8.2 Tutoriais para Registradores

**GoDaddy:**

```markdown
# Configurar Nameservers no GoDaddy

## Passo a Passo:

1. Acesse: https://account.godaddy.com/
2. Faça login com suas credenciais
3. Clique em "Meus Produtos"
4. Na seção "Domínios", localize seu domínio
5. Clique nos 3 pontos (⋮) → "Gerenciar DNS"
6. Role até "Nameservers"
7. Clique em "Alterar"
8. Selecione "Personalizado"
9. Cole os nameservers fornecidos:
   - Exemplo: sue.ns.cloudflare.com
   - Exemplo: leo.ns.cloudflare.com
10. Remova nameservers antigos (se houver)
11. Clique em "Salvar"

## Tempo de Propagação:
- Mínimo: 5 minutos
- Máximo: 48 horas (raro)
- Média: 15-30 minutos

## ⚠️ Atenção:
- Isso removerá todos registros DNS existentes
- Faça backup de MX records (email) se necessário
- Após mudança, aguarde nosso sistema verificar automaticamente
```

**Registro.br:**

```markdown
# Configurar Nameservers no Registro.br

## Passo a Passo:

1. Acesse: https://registro.br/
2. Faça login
3. Clique em "Painel de Controle"
4. Selecione o domínio desejado
5. Vá em "DNS" → "Alterar Servidores DNS"
6. Selecione "Usar servidores externos"
7. Cole os nameservers fornecidos:
   - DNS 1: sue.ns.cloudflare.com
   - DNS 2: leo.ns.cloudflare.com
8. Clique em "Salvar"

## Tempo de Propagação:
- Registro.br é geralmente rápido: 5-15 minutos

## Dica:
- Registro.br pode pedir para remover servidores antigos primeiro
- Use a opção "Remover todos" antes de adicionar os novos
```

**HostGator Brasil:**

```markdown
# Configurar Nameservers na HostGator

## Passo a Passo:

1. Acesse: https://cliente.hostgator.com.br/
2. Login → Área do Cliente
3. Vá em "Domínios" → "Meus Domínios"
4. Clique no domínio
5. Localize "Nameservers"
6. Selecione "Personalizado"
7. Cole os nameservers:
   - NS 1: sue.ns.cloudflare.com
   - NS 2: leo.ns.cloudflare.com
8. Salve as alterações

## Tempo de Propagação:
- 10-30 minutos (HostGator é rápida)
```

---

<a name="compatibilidade"></a>
## 🔄 9. Compatibilidade e Adaptações

### 9.1 Banco de Dados

**Mudanças necessárias: ZERO!**

Opcional (recomendado):

```sql
-- Adicionar coluna metadata (se não existir):
ALTER TABLE dns_zones 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index para buscar por provider:
CREATE INDEX IF NOT EXISTS idx_dns_zones_provider 
ON dns_zones ((metadata->>'provider'));

-- Exemplos de uso:
-- Buscar zonas Cloudflare:
SELECT * FROM dns_zones WHERE metadata->>'provider' = 'cloudflare';

-- Buscar zonas Digital Ocean:
SELECT * FROM dns_zones WHERE metadata->>'provider' = 'digitalocean';

-- Atualizar zona existente para CF (migração manual):
UPDATE dns_zones 
SET metadata = jsonb_build_object(
  'provider', 'cloudflare',
  'zone_id', 'cf_zone_id_aqui',
  'account_id', 'cf_account_id'
)
WHERE domain = 'example.com';
```

### 9.2 Triggers SQL

**Mudanças: ZERO!**

Os triggers atuais continuam funcionando perfeitamente:

```sql
-- Verificar triggers:
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'dns_zones';

-- Resultado esperado:
-- trigger_sync_custom_domain_on_update
-- trigger_sync_custom_domain_on_delete
-- update_dns_zones_updated_at
```

### 9.3 Variáveis de Ambiente

**Adicionar (sem remover antigas):**

```bash
# .env ou Digital Ocean App Platform

# Cloudflare (NOVO)
CLOUDFLARE_API_TOKEN=seu_token_cloudflare
CLOUDFLARE_ACCOUNT_ID=seu_account_id_cloudflare
DNS_PROVIDER=digitalocean  # ou 'cloudflare' quando pronto

# Digital Ocean (MANTER para rollback)
DO_ACCESS_TOKEN=seu_token_do
DO_APP_ID=seu_app_id

# Feature Flags (NOVO - opcional)
ENABLE_CLOUDFLARE=false  # true quando pronto para produção
CLOUDFLARE_ROLLOUT_PERCENTAGE=0  # 0-100 (gradual rollout)
```

### 9.4 Feature Flag System (Avançado)

**Arquivo:** `frontend/lib/feature-flags.ts`

```typescript
/**
 * Sistema de feature flags para rollout gradual
 */

export function getDNSProvider(brokerId?: string): 'digitalocean' | 'cloudflare' {
  const envProvider = process.env.DNS_PROVIDER as 'digitalocean' | 'cloudflare';
  const enableCF = process.env.ENABLE_CLOUDFLARE === 'true';
  const rolloutPercent = parseInt(process.env.CLOUDFLARE_ROLLOUT_PERCENTAGE || '0');

  // Se CF desabilitado, sempre usar DO
  if (!enableCF) {
    return 'digitalocean';
  }

  // Se rollout = 100%, sempre usar CF
  if (rolloutPercent === 100) {
    return 'cloudflare';
  }

  // Se rollout = 0%, sempre usar DO
  if (rolloutPercent === 0) {
    return envProvider || 'digitalocean';
  }

  // Rollout gradual baseado em hash do brokerId
  if (brokerId) {
    const hash = hashCode(brokerId);
    const bucket = Math.abs(hash) % 100;
    return bucket < rolloutPercent ? 'cloudflare' : 'digitalocean';
  }

  return envProvider || 'digitalocean';
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
```

**Uso:**

```typescript
// No endpoint de criação de zona:
import { getDNSProvider } from '@/lib/feature-flags';

const provider = getDNSProvider(brokerId);

if (provider === 'cloudflare') {
  // Chamar cf-create-zone
} else {
  // Chamar do-create-zone
}
```

---

## 📄 Fim da Parte 2

Neste documento você viu:
- ✅ Migração passo a passo (Fase 1 e 2)
- ✅ Implementação completa de código
- ✅ Configuração do cliente
- ✅ Compatibilidade e adaptações

**Próximo arquivo (Parte 3):**
- Testes e validação
- Rollback plan
- FAQ e troubleshooting
- Exemplos práticos

👉 Continue em: **`CLOUDFLARE_MIGRATION_PARTE_3.md`**
