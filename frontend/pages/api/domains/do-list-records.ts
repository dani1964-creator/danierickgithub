import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API para listar registros DNS de uma zona
 * 
 * GET /api/domains/do-list-records?zoneId=uuid
 * GET /api/domains/do-list-records?brokerId=uuid
 * 
 * Retorna todos os registros DNS customizados pelo cliente
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zoneId, brokerId } = req.query;

    if (!zoneId && !brokerId) {
      return res.status(400).json({ error: 'Zone ID or Broker ID is required' });
    }

    // Buscar zona por ID ou broker_id
    let query = supabase.from('dns_zones').select('*');
    
    if (zoneId && typeof zoneId === 'string') {
      query = query.eq('id', zoneId);
    } else if (brokerId && typeof brokerId === 'string') {
      query = query.eq('broker_id', brokerId);
    }

    const { data: zone, error: zoneError } = await query.single();

    if (zoneError || !zone) {
      // Retornar vazio ao invés de erro quando não há zona
      return res.status(200).json({
        success: true,
        zone: null,
        records: [],
        count: 0
      });
    }

    // Buscar registros usando o ID da zona encontrada
    const { data: records, error: recordsError } = await supabase
      .from('dns_records')
      .select('*')
      .eq('zone_id', zone.id)
      .order('created_at', { ascending: false });

    if (recordsError) {
      console.error('Error fetching records:', recordsError);
      return res.status(500).json({ error: 'Failed to fetch records' });
    }

    return res.status(200).json({
      success: true,
      zone: {
        id: zone.id,
        domain: zone.domain,
        status: zone.status,
        nameservers: zone.nameservers,
        activated_at: zone.activated_at
      },
      records: records || [],
      count: records?.length || 0
    });
  } catch (error) {
    console.error('Error listing DNS records:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
