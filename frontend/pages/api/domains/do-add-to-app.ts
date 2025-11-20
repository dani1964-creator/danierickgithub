import type { NextApiRequest, NextApiResponse } from 'next';

const DO_ACCESS_TOKEN = process.env.DO_ACCESS_TOKEN;
const DO_APP_ID = process.env.DO_APP_ID;

/**
 * API para adicionar um domínio ao Digital Ocean App Platform
 * 
 * POST /api/domains/do-add-to-app
 * Body: { domain: "example.com" }
 * 
 * Adiciona o domínio e www.domínio ao App Platform para provisionar certificado SSL
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DO_ACCESS_TOKEN || !DO_APP_ID) {
    return res.status(503).json({ 
      error: 'Digital Ocean credentials not configured',
      details: 'DO_ACCESS_TOKEN or DO_APP_ID missing',
    });
  }

  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    console.log(`[DO-ADD] Adicionando domínio ${domain} ao App Platform...`);

    // 1. Buscar configuração atual do app
    const getResponse = await fetch(`https://api.digitalocean.com/v2/apps/${DO_APP_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
      },
    });

    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      console.error('[DO-ADD] Erro ao buscar app:', errorData);
      return res.status(getResponse.status).json({
        error: 'Failed to fetch Digital Ocean app',
        details: errorData,
      });
    }

    const appData = await getResponse.json();
    const app = appData.app;

    // 2. Verificar se domínio já existe
    const existingDomains = app.spec?.domains || [];
    const domainExists = existingDomains.some((d: any) => d.domain === domain);
    const wwwDomain = `www.${domain}`;
    const wwwExists = existingDomains.some((d: any) => d.domain === wwwDomain);

    if (domainExists && wwwExists) {
      console.log(`[DO-ADD] Domínios ${domain} e ${wwwDomain} já existem no App Platform`);
      return res.status(200).json({
        success: true,
        message: 'Domains already exist',
        domain,
        www: wwwDomain,
        alreadyExists: true,
      });
    }

    // 3. Adicionar novos domínios à configuração
    const newDomains = [...existingDomains];

    if (!domainExists) {
      newDomains.push({
        domain: domain,
        type: 'PRIMARY',
        wildcard: false,
        zone: domain,
      });
      console.log(`[DO-ADD] Adicionando domínio principal: ${domain}`);
    }

    if (!wwwExists) {
      newDomains.push({
        domain: wwwDomain,
        type: 'ALIAS',
        wildcard: false,
        zone: domain,
      });
      console.log(`[DO-ADD] Adicionando subdomínio www: ${wwwDomain}`);
    }

    // 4. Atualizar app com novos domínios
    const updatePayload = {
      spec: {
        ...app.spec,
        domains: newDomains,
      },
    };

    console.log(`[DO-ADD] Atualizando app com ${newDomains.length} domínios...`);

    const updateResponse = await fetch(`https://api.digitalocean.com/v2/apps/${DO_APP_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('[DO-ADD] Erro ao atualizar app:', errorData);
      return res.status(updateResponse.status).json({
        error: 'Failed to update Digital Ocean app',
        details: errorData,
      });
    }

    const updateResult = await updateResponse.json();
    console.log(`[DO-ADD] ✅ Domínio ${domain} adicionado com sucesso! SSL será provisionado automaticamente.`);

    return res.status(200).json({
      success: true,
      message: 'Domain added to App Platform successfully',
      domain,
      www: wwwDomain,
      deployment: updateResult.deployment,
      note: 'SSL certificate will be provisioned automatically by Let\'s Encrypt (5-15 minutes)',
    });

  } catch (error) {
    console.error('[DO-ADD] Erro geral:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
