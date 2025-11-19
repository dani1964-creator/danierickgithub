import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE credentials missing for server-side API');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Buscar brokers com contagem de imóveis
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('*')
      .order('created_at', { ascending: false });

    if (brokersError) {
      console.error('Error fetching brokers:', brokersError);
      return res.status(500).json({ error: brokersError.message });
    }

    // Buscar contagem de imóveis para cada broker
    const brokersWithCounts = await Promise.all(
      (brokers || []).map(async (broker) => {
        const { count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', broker.id);

        return {
          ...broker,
          properties_count: count || 0,
        };
      })
    );

    return res.status(200).json({ data: brokersWithCounts });
  } catch (error: any) {
    console.error('Error in /api/superadmin/brokers:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
