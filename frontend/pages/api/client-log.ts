import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { level = 'info', message = '', context = {} } = req.body || {};
    const stamp = new Date().toISOString();
    // Log simples no servidor para que possamos capturar em logs do processo
    // Formato: [client-log][LEVEL] TIMESTAMP message context
    // Mantemos também console.error para erros de nível error
    const prefix = `[client-log][${String(level).toUpperCase()}] ${stamp}`;
    if (level === 'error') {
      console.error(prefix, message, context);
    } else if (level === 'warn' || level === 'warning') {
      console.warn(prefix, message, context);
    } else {
      console.log(prefix, message, context);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[client-log][ERROR] failed to log client message', err);
    return res.status(500).json({ ok: false, error: 'internal error' });
  }
}
