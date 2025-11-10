import type { NextApiRequest, NextApiResponse } from 'next';

// Endpoint temporário de diagnóstico. NÃO exponha em produção.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const headers = req.headers;

  // Não retornamos valores de chaves secretas — apenas informamos se estão definidas.
  const envPresence = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_DOMAIN: !!process.env.NEXT_PUBLIC_BASE_DOMAIN,
  };

  res.status(200).json({
    ok: true,
    headers: {
      host: headers.host || null,
      'x-forwarded-host': headers['x-forwarded-host'] || null,
      'x-forwarded-for': headers['x-forwarded-for'] || null,
      'x-real-ip': headers['x-real-ip'] || null,
      'x-forwarded-proto': headers['x-forwarded-proto'] || null,
    },
    envPresence,
    note: 'Este endpoint é apenas para depuração. Remova após o diagnóstico.'
  });
}
