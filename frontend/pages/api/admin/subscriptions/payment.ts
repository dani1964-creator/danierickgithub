import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptionId, pixKey, qrCodeUrl, notes } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Update subscription payment info
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        pix_key: pixKey?.trim() || null,
        pix_qr_code_image_url: qrCodeUrl?.trim() || null,
        notes: notes?.trim() || null,
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error updating payment info:', error);
      return res.status(500).json({ error: 'Failed to update payment info' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}