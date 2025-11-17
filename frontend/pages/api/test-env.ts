import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return res.status(200).json({
    environment: process.env.NODE_ENV,
    variables: {
      NEXT_PUBLIC_SUPABASE_URL: {
        configured: hasUrl,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        configured: hasAnonKey,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        configured: hasServiceKey,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        // Mostrar primeiros 10 caracteres para confirmar (sem expor o token completo)
        preview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'não configurado',
      },
    },
    allConfigured: hasServiceKey && hasUrl && hasAnonKey,
  });
}
