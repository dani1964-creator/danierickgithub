// Edge function: admin-brokers
// Provides admin-only endpoints to manage brokers using Service Role
// Auth is verified via simple internal credentials sent from the frontend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sa-email, x-sa-pass',
};

// Internal credentials (kept server-side only)
const SUPER_ADMIN_EMAIL = 'erickjq123@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Danis0133';

function getSupabaseClient() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

async function listBrokers() {
  const supabase = getSupabaseClient();

  // Fetch all brokers
  const { data: brokers, error: brokersError } = await supabase
    .from('brokers')
    .select('id, user_id, business_name, display_name, email, website_slug, phone, whatsapp_number, contact_email, is_active, plan_type, max_properties, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (brokersError) throw brokersError;

  // Fetch active properties to compute counts
  const { data: props, error: propsError } = await supabase
    .from('properties')
    .select('id, broker_id')
    .eq('is_active', true);

  if (propsError) throw propsError;

  const counts = new Map<string, number>();
  for (const p of props || []) {
    counts.set(p.broker_id, (counts.get(p.broker_id) || 0) + 1);
  }

  const enriched = (brokers || []).map(b => ({
    ...b,
    properties_count: counts.get(b.id) || 0,
  }));

  return { brokers: enriched };
}

async function toggleBrokerStatus(brokerId: string, newStatus: boolean) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('brokers')
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq('id', brokerId);
  if (error) throw error;
  return { success: true };
}

async function deleteBroker(brokerId: string) {
  const supabase = getSupabaseClient();

  // Delete related data first
  const ops = [
    supabase.from('properties').delete().eq('broker_id', brokerId),
    supabase.from('realtors').delete().eq('broker_id', brokerId),
    supabase.from('leads').delete().eq('broker_id', brokerId),
    supabase.from('social_links').delete().eq('broker_id', brokerId),
  ];

  for (const op of ops) {
    const { error } = await op;
    if (error) throw error;
  }

  const { error } = await supabase.from('brokers').delete().eq('id', brokerId);
  if (error) throw error;
  return { success: true };
}

function isAuthorized(req: Request, body: any) {
  // Accept either headers or body credentials
  const email = req.headers.get('x-sa-email') || body?.email;
  const password = req.headers.get('x-sa-pass') || body?.password;
  return email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (!isAuthorized(req, body)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const action = body.action as string;

    if (action === 'list') {
      const data = await listBrokers();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'toggle') {
      const { brokerId, newStatus } = body;
      const data = await toggleBrokerStatus(brokerId, newStatus);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete') {
      const { brokerId } = body;
      const data = await deleteBroker(brokerId);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'invalid_action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('admin-brokers error:', e);
    return new Response(JSON.stringify({ error: 'server_error', details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});