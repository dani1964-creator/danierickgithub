#!/usr/bin/env node
// Script simples para listar propriedades sem 'slug' via Supabase REST API.
// Usage:
//   SUPABASE_URL=https://your-supabase-url.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_service_key node scripts/check-missing-slugs.js

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Erro: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(2);
}

const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/properties?select=id,title,slug,broker_id&slug=is.null&is_active=eq.true&limit=500`;

(async () => {
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Erro na requisição:', res.status, res.statusText, text);
      process.exit(3);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('Resposta inesperada:', data);
      process.exit(4);
    }

    if (data.length === 0) {
      console.log('Nenhuma propriedade sem slug encontrada (limit 500).');
      process.exit(0);
    }

    console.log(`Encontradas ${data.length} propriedades sem slug (limit 500):`);
    for (const p of data) {
      console.log(`- id=${p.id} broker_id=${p.broker_id} title="${p.title || ''}"`);
    }

    // Exit 0 success
    process.exit(0);
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
})();
