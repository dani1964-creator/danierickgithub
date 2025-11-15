import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { brokerId, days = 30 } = req.body;

    if (!brokerId) {
      return res.status(400).json({ error: 'Broker ID is required' });
    }

    // Call the renew_subscription function
    const { error } = await supabaseAdmin.rpc('renew_subscription', {
      broker_uuid: brokerId,
      renewal_days: days
    });

    if (error) {
      console.error('Error renewing subscription:', error);
      return res.status(500).json({ error: 'Failed to renew subscription' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}