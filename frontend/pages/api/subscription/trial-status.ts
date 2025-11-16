import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * API para verificar status do trial
 * GET /api/subscription/trial-status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar sessão do usuário
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Buscar broker do usuário
    const { data: broker, error: brokerError } = await supabaseAdmin
      .from('brokers')
      .select('id, trial_ends_at')
      .eq('user_id', user.id)
      .single();

    if (brokerError || !broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Buscar subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan_type, trial_end_date')
      .eq('broker_id', broker.id)
      .single();

    if (subError || !subscription) {
      return res.status(200).json({ 
        isTrialing: false,
        daysRemaining: 0,
      });
    }

    const isTrialing = subscription.status === 'trial';

    if (!isTrialing) {
      return res.status(200).json({ 
        isTrialing: false,
        daysRemaining: 0,
      });
    }

    // Calcular dias restantes
    const trialEndsAt = new Date(subscription.trial_end_date || broker.trial_ends_at || '');
    const today = new Date();
    const diffTime = trialEndsAt.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      isTrialing: true,
      daysRemaining: Math.max(0, daysRemaining),
      trialEndsAt: trialEndsAt.toISOString(),
    });

  } catch (error) {
    console.error('Trial status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
