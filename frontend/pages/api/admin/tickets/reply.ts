import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificação de autenticação admin
  const adminAuth = req.headers['x-admin-auth'];
  if (adminAuth !== 'admin-access') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { ticketId, message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Usar service role para inserir resposta
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Buscar informações do ticket para pegar broker_id
    const { data: ticket, error: ticketError } = await supabase
      .from('broker_communications')
      .select('broker_id, subject')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket:', ticketError);
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Inserir resposta do admin
    const { data: reply, error: replyError } = await supabase
      .from('broker_communications')
      .insert({
        broker_id: ticket.broker_id,
        sender_type: 'admin',
        message: message,
        subject: `Re: ${ticket.subject || 'Resposta'}`,
        is_read: false,
        priority: 'normal',
      })
      .select()
      .single();

    if (replyError) {
      console.error('Erro ao inserir resposta:', replyError);
      return res.status(500).json({ error: 'Erro ao enviar resposta' });
    }

    // Marcar ticket original como lido
    await supabase
      .from('broker_communications')
      .update({ is_read: true })
      .eq('id', ticketId);

    return res.status(200).json({ 
      success: true, 
      reply: reply 
    });

  } catch (error) {
    console.error('Erro ao processar resposta:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao processar resposta',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
