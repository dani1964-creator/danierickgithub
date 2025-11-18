import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API para listar todas as verificações de domínio de um broker
 * 
 * GET /api/domains/list?brokerId=<uuid>
 * 
 * Retorna array com todas as verificações de domínio
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { brokerId } = req.query;

    if (!brokerId || typeof brokerId !== 'string') {
      return res.status(400).json({ error: 'Broker ID is required' });
    }

    // Buscar todas as verificações do broker
    const { data: verifications, error } = await supabase
      .from('domain_verifications')
      .select('*')
      .eq('broker_id', brokerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verifications:', error);
      return res.status(500).json({ error: 'Failed to fetch domain verifications' });
    }

    // Formatar resposta
    const formattedVerifications = verifications?.map((v) => ({
      domain: v.domain,
      isValid: v.is_valid,
      lastChecked: v.last_checked,
      createdAt: v.created_at,
      status: v.is_valid ? '✅ Verificado' : (v.last_checked ? '❌ Falhou' : '⏳ Pendente'),
    })) || [];

    return res.status(200).json({
      success: true,
      brokerId,
      count: formattedVerifications.length,
      verifications: formattedVerifications,
    });
  } catch (error) {
    console.error('Error listing domain verifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
