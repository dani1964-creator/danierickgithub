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
    console.log('🔍 Executando verificação de vencimentos...');

    // Call the subscription expiration check function
    const { error } = await supabaseAdmin.rpc('check_subscription_expiration');

    if (error) {
      console.error('❌ Erro na verificação:', error);
      return res.status(500).json({ 
        error: 'Failed to check subscription expiration',
        details: error.message
      });
    }

    console.log('✅ Verificação de vencimentos concluída');

    return res.status(200).json({ 
      success: true, 
      message: 'Subscription expiration check completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}