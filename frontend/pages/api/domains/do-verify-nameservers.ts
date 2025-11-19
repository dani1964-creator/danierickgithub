import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API para verificar se nameservers foram configurados
 * 
 * POST /api/domains/do-verify-nameservers
 * Body: { domain: string }
 * 
 * Verifica via Google DNS API se os nameservers estão apontando para Digital Ocean
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Buscar zona no banco
    const { data: zone, error: zoneError } = await supabase
      .from('dns_zones')
      .select('*')
      .eq('domain', domain)
      .single();

    if (zoneError || !zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Verificar nameservers via Google DNS API
    const nsResponse = await fetch(
      `https://dns.google/resolve?name=${domain}&type=NS`
    );
    const nsData = await nsResponse.json();

    // Verificar se algum nameserver é do Digital Ocean
    const hasDigitalOceanNS = nsData.Answer?.some((answer: any) => 
      answer.data?.includes('digitalocean.com')
    );

    // Atualizar status
    const newStatus = hasDigitalOceanNS ? 'active' : 'verifying';
    const updates: any = {
      status: newStatus,
      last_verification_at: new Date().toISOString(),
      verification_attempts: zone.verification_attempts + 1
    };

    if (hasDigitalOceanNS && !zone.activated_at) {
      updates.activated_at = new Date().toISOString();
    }

    await supabase
      .from('dns_zones')
      .update(updates)
      .eq('id', zone.id);

    return res.status(200).json({
      success: true,
      domain,
      status: newStatus,
      isActive: hasDigitalOceanNS,
      nameserversDetected: nsData.Answer?.map((a: any) => a.data) || [],
      message: hasDigitalOceanNS 
        ? '✅ Nameservers configurados corretamente! Domínio ativo.'
        : '⏳ Aguardando configuração dos nameservers. Verifique se você configurou corretamente no seu registrador.'
    });
  } catch (error) {
    console.error('Error verifying nameservers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
