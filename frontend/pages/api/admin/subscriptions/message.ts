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
    const { brokerId, message } = req.body;

    if (!brokerId || !message?.trim()) {
      return res.status(400).json({ error: 'Broker ID and message are required' });
    }

    // Get subscription ID for this broker
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('broker_id', brokerId)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Insert admin message
    const { error } = await supabaseAdmin
      .from('subscription_communications')
      .insert({
        subscription_id: subscription.id,
        broker_id: brokerId,
        sender_type: 'admin',
        message: message.trim(),
        subject: 'Mensagem do Suporte Admin',
      });

    if (error) {
      console.error('Error sending admin message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}