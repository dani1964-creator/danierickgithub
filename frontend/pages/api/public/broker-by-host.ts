// Rota pública para obter dados públicos do broker com base no host ou slug
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPublicBrokerByHost } from '@/lib/server/brokerService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const host = (req.query.host as string) || (req.headers['x-hostname'] as string) || req.headers.host;
    const brokerSlug = (req.query.slug as string) || (req.headers['x-broker-slug'] as string) || '';
    const customDomain = (req.query.custom as string) || (req.headers['x-custom-domain'] as string) || '';

    const broker = await getPublicBrokerByHost({ hostname: String(host || ''), brokerSlug: String(brokerSlug || ''), customDomain: String(customDomain || '') });

    if (!broker) {
      return res.status(404).json({ ok: false, error: 'Broker not found' });
    }

    return res.status(200).json({ ok: true, broker });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
}
