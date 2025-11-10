import type { NextApiRequest, NextApiResponse } from 'next';
import { getPublicBroker } from '@/lib/publicQueries';

// Endpoint temporário de diagnóstico para inspecionar o broker resolvido pelo host.
// Não expõe segredos, apenas dados públicos do broker (logo_url, background_image_url, etc).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await getPublicBroker();
    if (result.error) {
      return res.status(404).json({ ok: false, error: result.error.message || result.error });
    }

    // retornamos apenas o objeto do broker (ou null) para inspeção
    return res.status(200).json({ ok: true, broker: result.data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
