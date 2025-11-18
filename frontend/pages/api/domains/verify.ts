import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API para verificar propagação de DNS de um domínio
 * 
 * POST /api/domains/verify
 * Body: { brokerId: string, domain: string }
 * 
 * Verifica se o domínio está apontando corretamente e atualiza o status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { brokerId, domain } = req.body;

    if (!brokerId || !domain) {
      return res.status(400).json({ error: 'Broker ID and domain are required' });
    }

    // Verificar se o domínio existe para esse broker
    const { data: verification } = await supabase
      .from('domain_verifications')
      .select('*')
      .eq('broker_id', brokerId)
      .eq('domain', domain)
      .single();

    if (!verification) {
      return res.status(404).json({ error: 'Domain verification not found' });
    }

    // Tentar fazer request ao domínio para verificar se está apontando corretamente
    let isValid = false;
    let errorMessage = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      
      // Se conseguir conectar (mesmo que retorne 404, significa que o DNS está funcionando)
      isValid = response.status < 500;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Connection timeout - DNS may not be configured yet';
        } else {
          errorMessage = `DNS verification failed: ${error.message}`;
        }
      }
    }

    // Atualizar status da verificação
    const { error: updateError } = await supabase
      .from('domain_verifications')
      .update({
        is_valid: isValid,
        last_checked: new Date().toISOString(),
      })
      .eq('broker_id', brokerId)
      .eq('domain', domain);

    if (updateError) {
      console.error('Error updating verification:', updateError);
    }

    return res.status(200).json({
      success: true,
      domain,
      isValid,
      status: isValid ? 'propagated' : (errorMessage.includes('timeout') ? 'timeout' : 'not_propagated'),
      message: isValid 
        ? 'DNS is configured correctly and domain is accessible' 
        : errorMessage || 'DNS not propagated yet. Please wait and try again.',
      suggestion: !isValid ? 'Check your DNS settings and wait 24-48 hours for propagation' : undefined,
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
