import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Simple auth check for admin endpoints
function isAuthorized(req: NextApiRequest): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_SA_EMAIL;
  const adminPass = process.env.NEXT_PUBLIC_SA_PASSWORD;
  
  const { email, password } = req.body || {};
  return email === adminEmail && password === adminPass;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Basic auth check - in production, use proper session management
    const authHeader = req.headers['x-admin-auth'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Admin authorization required' });
    }

    // Get all subscriptions with broker info
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscription_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    return res.status(200).json({ subscriptions });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}