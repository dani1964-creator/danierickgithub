import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * API para enviar comprovante de pagamento PIX
 * POST /api/subscription/submit-payment-proof
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.split(' ')[1];
    const { transactionId, notes } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'ID da transação é obrigatório' });
    }

    // Verificar sessão do usuário
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Buscar broker do usuário
    const { data: broker, error: brokerError } = await supabaseAdmin
      .from('brokers')
      .select('id, business_name, email')
      .eq('user_id', user.id)
      .single();

    if (brokerError || !broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Criar comunicação com o comprovante
    const message = `
🔔 COMPROVANTE DE PAGAMENTO RECEBIDO

ID da Transação: ${transactionId}
${notes ? `Observações: ${notes}` : ''}

Data/Hora: ${new Date().toLocaleString('pt-BR')}

⏳ Aguardando confirmação do pagamento para ativar a assinatura.
    `.trim();

    const { error: commError } = await supabaseAdmin
      .from('subscription_communications')
      .insert({
        broker_id: broker.id,
        sender_type: 'client',
        subject: 'Comprovante de Pagamento - Upgrade',
        message: message,
        priority: 'high',
        is_read: false,
      });

    if (commError) {
      console.error('Error creating communication:', commError);
      return res.status(500).json({ error: 'Erro ao registrar comprovante' });
    }

    // TODO: Criar notificação para admin
    // TODO: Integrar com sistema de verificação automática de PIX (API do banco)

    return res.status(200).json({
      success: true,
      message: 'Comprovante enviado com sucesso! Sua assinatura será ativada em breve.',
    });

  } catch (error) {
    console.error('Submit payment proof error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
