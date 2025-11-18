import type { NextApiRequest, NextApiResponse } from 'next';

const DO_ACCESS_TOKEN = process.env.DO_ACCESS_TOKEN;
const DO_APP_ID = process.env.DO_APP_ID;

/**
 * API para verificar status de um domínio no Digital Ocean App Platform
 * 
 * GET /api/domains/do-status?domain=example.com
 * 
 * Retorna informações sobre certificado SSL, status do domínio, etc.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DO_ACCESS_TOKEN || !DO_APP_ID) {
    return res.status(503).json({ 
      error: 'Digital Ocean credentials not configured',
      available: false,
    });
  }

  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    // Buscar informações do app no Digital Ocean
    const response = await fetch(`https://api.digitalocean.com/v2/apps/${DO_APP_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: 'Failed to fetch Digital Ocean app info',
        details: errorData,
      });
    }

    const appData = await response.json();
    const app = appData.app;

    // Encontrar o domínio específico
    const domainInfo = app.spec?.domains?.find((d: any) => d.domain === domain);

    if (!domainInfo) {
      return res.status(404).json({ 
        error: 'Domain not found in Digital Ocean app',
        domain,
      });
    }

    // Buscar informações de certificado SSL se disponível
    let certificateInfo = null;
    if (domainInfo.certificate_id) {
      try {
        const certResponse = await fetch(
          `https://api.digitalocean.com/v2/apps/${DO_APP_ID}/domains/${domain}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
            },
          }
        );

        if (certResponse.ok) {
          const certData = await certResponse.json();
          certificateInfo = certData.domain?.certificate;
        }
      } catch (certError) {
        console.warn('Could not fetch certificate info:', certError);
      }
    }

    return res.status(200).json({
      success: true,
      domain: domainInfo.domain,
      type: domainInfo.type,
      wildcard: domainInfo.wildcard,
      certificate: certificateInfo ? {
        id: certificateInfo.id,
        state: certificateInfo.state,
        expiresAt: certificateInfo.not_after,
        autoRenew: certificateInfo.auto_renew,
      } : null,
      status: 'active',
    });
  } catch (error) {
    console.error('Error fetching Digital Ocean domain status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
