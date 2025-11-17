import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (brokerError || !broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Buscar dados da assinatura
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscription_details')
      .select('*')
      .eq('broker_id', broker.id)
      .single();

    if (subError) {
      // Se não encontrou assinatura, tentar criar uma nova
      if (subError.code === 'PGRST116') {
        console.log('Subscription not found, creating new trial subscription for broker:', broker.id);
        
        // Chamar função para criar assinatura trial
        const { error: createError } = await supabaseAdmin.rpc('initialize_subscription_trial', {
          p_broker_id: broker.id
        });

        if (createError) {
          console.error('Error creating subscription:', createError);
          return res.status(500).json({ error: 'Failed to create subscription' });
        }

        // Buscar novamente após criar
        const { data: newSubscription, error: newSubError } = await supabaseAdmin
          .from('subscription_details')
          .select('*')
          .eq('broker_id', broker.id)
          .single();

        if (newSubError) {
          console.error('Error fetching new subscription:', newSubError);
          return res.status(500).json({ error: 'Subscription created but failed to fetch' });
        }

        return res.status(200).json({ subscription: newSubscription });
      }
      
      console.error('Error fetching subscription:', subError);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ subscription });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}