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
    const authHeader = req.headers['x-admin-auth'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Admin authorization required' });
    }

    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId is required' });
    }

    const { error } = await supabaseAdmin
      .from('subscription_communications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) {
      console.error('Error marking ticket as read:', error);
      return res.status(500).json({ error: 'Failed to mark as read' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
