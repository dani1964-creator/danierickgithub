import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { cleanDomain, isValidDomain, getDnsInstructions, DomainErrors } from '@/lib/domainUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DO_ACCESS_TOKEN = process.env.DO_ACCESS_TOKEN;
const DO_APP_ID = process.env.DO_APP_ID;

/**
 * API para provisionamento automático de domínio no Digital Ocean App Platform
 * 
 * POST /api/domains/provision
 * Body: { brokerId: string, domain: string }
 * 
 * Se as variáveis DO não estiverem configuradas, retorna erro sugerindo usar /configure
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

    // Verificar se as variáveis do Digital Ocean estão configuradas
    if (!DO_ACCESS_TOKEN || !DO_APP_ID) {
      console.warn('Digital Ocean variables not configured, falling back to manual configuration');
      
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

      // Retornar instruções DNS com aviso
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'adminimobiliaria.site';
      const instructions = getDnsInstructions(baseDomain);

      return res.status(200).json({
        success: true,
        domain: normalizedDomain,
        warning: DomainErrors.DO_VARIABLES_MISSING,
        manualConfiguration: true,
        ...instructions,
      });
    }

    // Adicionar domínio ao Digital Ocean App Platform
    try {
      const response = await fetch(`https://api.digitalocean.com/v2/apps/${DO_APP_ID}/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          domain: normalizedDomain,
          type: 'PRIMARY',
          wildcard: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Digital Ocean API error:', errorData);
        
        // Se falhar, ainda atualiza no banco mas retorna erro
        const { error: updateError } = await supabase
          .from('brokers')
          .update({ custom_domain: normalizedDomain })
          .eq('id', brokerId);

        return res.status(response.status).json({
          error: DomainErrors.DO_API_ERROR,
          details: errorData,
          domainSavedInDatabase: !updateError,
        });
      }

      const doData = await response.json();

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
      }

      return res.status(200).json({
        success: true,
        domain: normalizedDomain,
        digitalOcean: doData,
        message: 'Domain provisioned successfully on Digital Ocean',
      });
    } catch (doError) {
      console.error('Error calling Digital Ocean API:', doError);
      
      // Fallback: salvar no banco mesmo se a API do DO falhar
      const { error: updateError } = await supabase
        .from('brokers')
        .update({ custom_domain: normalizedDomain })
        .eq('id', brokerId);

      return res.status(500).json({
        error: DomainErrors.DO_API_ERROR,
        details: String(doError),
        domainSavedInDatabase: !updateError,
      });
    }
  } catch (error) {
    console.error('Error provisioning domain:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
