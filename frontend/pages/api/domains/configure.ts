import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { cleanDomain, isValidDomain, getDnsInstructions, DomainErrors } from '@/lib/domainUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API para configuração manual de domínio personalizado (sem provisionar no Digital Ocean)
 * 
 * POST /api/domains/configure
 * Body: { brokerId: string, domain: string }
 * 
 * Retorna instruções de DNS para configuração manual
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { brokerId, domain } = req.body;

    // Validação de entrada
    if (!brokerId) {
      return res.status(400).json({ error: DomainErrors.MISSING_BROKER_ID });
    }

    if (!domain) {
      return res.status(400).json({ error: DomainErrors.MISSING_DOMAIN });
    }

    // Normalizar domínio
    const normalizedDomain = cleanDomain(domain);

    // Validar formato
    if (!isValidDomain(normalizedDomain)) {
      return res.status(400).json({ error: DomainErrors.INVALID_FORMAT });
    }

    // Verificar se o broker existe
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id, custom_domain')
      .eq('id', brokerId)
      .single();

    if (brokerError || !broker) {
      return res.status(404).json({ error: DomainErrors.NOT_FOUND });
    }

    // Verificar se o domínio já está em uso por outro broker
    const { data: existingBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('custom_domain', normalizedDomain)
      .neq('id', brokerId)
      .single();

    if (existingBroker) {
      return res.status(409).json({ error: DomainErrors.DUPLICATE_DOMAIN });
    }

    // Atualizar broker com novo domínio
    const { error: updateError } = await supabase
      .from('brokers')
      .update({ custom_domain: normalizedDomain })
      .eq('id', brokerId);

    if (updateError) {
      console.error('Error updating broker:', updateError);
      return res.status(500).json({ error: DomainErrors.UPDATE_FAILED });
    }

    // Criar registro de verificação
    const { error: verificationError } = await supabase
      .from('domain_verifications')
      .insert({
        broker_id: brokerId,
        domain: normalizedDomain,
        is_valid: false,
        last_checked: new Date().toISOString(),
      });

    if (verificationError) {
      console.error('Error creating verification:', verificationError);
      return res.status(500).json({ error: DomainErrors.VERIFICATION_FAILED });
    }

    // Retornar instruções DNS
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'adminimobiliaria.site';
    const instructions = getDnsInstructions(baseDomain);

    return res.status(200).json({
      success: true,
      domain: normalizedDomain,
      ...instructions,
    });
  } catch (error) {
    console.error('Error configuring domain:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
