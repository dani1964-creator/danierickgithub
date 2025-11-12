import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

/**
 * API Route: /api/broker/info
 * 
 * Proxy para o backend que busca informações do broker baseado no domínio.
 * Esta rota serve como ponte entre o frontend e o backend, facilitando
 * requisições cross-origin de subdomínios.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Headers CORS para todas as requisições
  const origin = req.headers.origin || '';
  const isAllowedOrigin = 
    origin === 'https://adminimobiliaria.site' ||
    origin === 'http://localhost:3000' ||
    origin === 'http://localhost:3001' ||
    origin.match(/^https:\/\/[\w-]+\.adminimobiliaria\.site$/);

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-broker-domain');
  }

  // Tratar preflight OPTIONS - IMPORTANTE para CORS!
  if (req.method === 'OPTIONS') {
    // Retornar 204 (No Content) para preflight
    return res.status(204).end();
  }

  // Permitir apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obter o hostname do header ou query
    let brokerDomain = 
      req.headers['x-broker-domain'] as string || 
      req.query.domain as string ||
      req.headers['x-forwarded-host'] as string ||
      req.headers.host as string;

    if (!brokerDomain) {
      return res.status(400).json({ 
        error: 'Missing broker domain',
        message: 'Não foi possível identificar o domínio da imobiliária'
      });
    }

    // Normalizar domínio: remover www. e porta
    brokerDomain = brokerDomain
      .toLowerCase()
      .replace(/^www\./, '') // Remove www.
      .split(':')[0]; // Remove porta se presente

    logger.info(`[API] Fetching broker info for domain: ${brokerDomain}`);

    // URL do backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const apiEndpoint = `${backendUrl}/api/tenant/identify?domain=${encodeURIComponent(brokerDomain)}`;

    // Fazer requisição para o backend
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-broker-domain': brokerDomain,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        return res.status(404).json({
          error: 'Broker not found',
          message: 'Imobiliária não encontrada para este domínio',
          domain: brokerDomain
        });
      }

      throw new Error(errorData.message || 'Backend error');
    }

    const data = await response.json();

    // Retornar dados do broker
    return res.status(200).json({
      broker: data.data || data.tenant || data,
      domain: brokerDomain
    });

  } catch (error: any) {
    logger.error('[API] Error fetching broker info:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Erro ao buscar informações da imobiliária'
    });
  }
}
