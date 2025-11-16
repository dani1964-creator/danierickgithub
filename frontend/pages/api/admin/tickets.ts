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
    // Verificar autenticação admin
    const authHeader = req.headers['x-admin-auth'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Admin authorization required' });
    }

    // Buscar tickets (subscription_communications) com informações do broker
    const { data: tickets, error } = await supabaseAdmin
      .from('subscription_communications')
      .select(`
        id,
        broker_id,
        sender_type,
        subject,
        message,
        priority,
        is_read,
        created_at,
        brokers (
          business_name,
          email
        )
      `)
      .eq('sender_type', 'client')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }

    // Formatar dados
    const formattedTickets = (tickets || []).map((ticket: any) => ({
      id: ticket.id,
      broker_id: ticket.broker_id,
      broker_name: ticket.brokers?.business_name || 'Desconhecido',
      broker_email: ticket.brokers?.email || '',
      subject: ticket.subject,
      message: ticket.message,
      priority: ticket.priority,
      is_read: ticket.is_read,
      created_at: ticket.created_at,
    }));

    return res.status(200).json({ tickets: formattedTickets });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
