import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (req.method === 'GET') {
      // Buscar mensagens
      const { data: communications, error } = await supabaseAdmin
        .from('subscription_communications')
        .select('*')
        .eq('broker_id', broker.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching communications:', error);
        return res.status(500).json({ error: 'Failed to fetch communications' });
      }

      return res.status(200).json({ communications });
    }

    if (req.method === 'POST') {
      // Enviar nova mensagem
      const { message, subject } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Buscar subscription_id
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('broker_id', broker.id)
        .single();

      if (subError || !subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      const { data, error } = await supabaseAdmin
        .from('subscription_communications')
        .insert({
          subscription_id: subscription.id,
          broker_id: broker.id,
          sender_type: 'client',
          sender_id: user.id,
          message: message.trim(),
          subject: subject?.trim() || 'Mensagem do cliente'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating communication:', error);
        return res.status(500).json({ error: 'Failed to send message' });
      }

      return res.status(201).json({ communication: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}