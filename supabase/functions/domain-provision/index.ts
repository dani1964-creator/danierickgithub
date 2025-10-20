// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
// Edge Function: domain-provision
// Provisiona um domínio na DigitalOcean App Platform para o app deste projeto
// Requer variáveis: DO_API_TOKEN (secret), DO_APP_ID (id do app), DO_ENV (ex.: 'production')
// Endpoint esperado pela UI: POST com { domain: string, broker_id?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Tipagens mínimas para evitar dependência de libs DOM no lint do repositório
declare const Deno: { env: { get(key: string): string | undefined } };
type RequestLike = { method: string; json(): Promise<unknown> };

type DOAppDomain = { name?: string; domain?: { name?: string } };
type DOAppSpec = { domains?: DOAppDomain[] };
type DOAppResponse = { app?: { spec?: DOAppSpec } };

const getDoDomainName = (d: DOAppDomain) => d.name ?? d.domain?.name;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: RequestLike) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

  const body = (await req.json()) as { domain?: string; broker_id?: string };
  const domain = body?.domain;
    if (!domain || typeof domain !== 'string') {
      return new Response(JSON.stringify({ error: 'missing domain' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const DO_API_TOKEN = Deno.env.get('DO_API_TOKEN');
    const DO_APP_ID = Deno.env.get('DO_APP_ID');

    if (!DO_API_TOKEN || !DO_APP_ID) {
      return new Response(JSON.stringify({ error: 'missing DO credentials' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1) Obter definição atual do app
    const appRes = await fetch(`https://api.digitalocean.com/v2/apps/${DO_APP_ID}`, {
      headers: { Authorization: `Bearer ${DO_API_TOKEN}` },
    });
    if (!appRes.ok) {
      const t = await appRes.text();
      return new Response(JSON.stringify({ error: 'failed to get app', details: t }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  const appJson = (await appRes.json()) as DOAppResponse;
  const spec = appJson.app?.spec as DOAppSpec | undefined;
    if (!spec) {
      return new Response(JSON.stringify({ error: 'missing app spec' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Adicionar domínio custom_domains se não existir
    const current: DOAppDomain[] = spec.domains || [];
    const exists = current.some((d) => getDoDomainName(d) === domain);
    if (!exists) {
      current.push({ name: domain });
    }

    // 3) Aplicar update no app (replace spec.domains)
    const updateRes = await fetch(`https://api.digitalocean.com/v2/apps/${DO_APP_ID}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${DO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spec: { ...spec, domains: current } }),
    });

    if (!updateRes.ok) {
      const t = await updateRes.text();
      return new Response(JSON.stringify({ error: 'failed to update app', details: t }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const out = await updateRes.json();
    return new Response(JSON.stringify({ ok: true, result: out }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'internal', details: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
