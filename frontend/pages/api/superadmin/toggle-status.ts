import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE credentials missing for server-side API');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { brokerId, currentStatus } = req.body;

    if (!brokerId || typeof currentStatus !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error } = await supabase
      .from('brokers')
      .update({ 
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', brokerId);

    if (error) {
      console.error('Error toggling broker status:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, newStatus: !currentStatus });
  } catch (error: any) {
    console.error('Error in /api/superadmin/toggle-status:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
