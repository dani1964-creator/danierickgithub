import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { cleanDomain, isValidDomain, DomainErrors } from '@/lib/domainUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DO_ACCESS_TOKEN = process.env.DO_ACCESS_TOKEN;
const APP_IP = process.env.NEXT_PUBLIC_APP_IP || '162.159.140.98';
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';

/**
 * API para criar zona DNS completa no Digital Ocean
 * 
 * POST /api/domains/do-create-zone
 * Body: { brokerId: string, domain: string }
 * 
 * Fluxo:
 * 1. Cria zona DNS no Digital Ocean
 * 2. Adiciona registros A, CNAME, wildcard automaticamente
 * 3. Salva no banco com nameservers
 * 4. Retorna instruções para cliente configurar nameservers
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DO_ACCESS_TOKEN) {
    return res.status(503).json({ 
      error: 'Digital Ocean API not configured',
      message: 'DO_ACCESS_TOKEN is required'
    });
  }

  try {
    const { brokerId, domain } = req.body;

    if (!brokerId || !domain) {
      return res.status(400).json({ error: 'Broker ID and domain are required' });
    }

    // Normalizar e validar domínio
    const normalizedDomain = cleanDomain(domain);
    
    if (!isValidDomain(normalizedDomain)) {
      return res.status(400).json({ error: DomainErrors.INVALID_FORMAT });
    }

    // Verificar se broker existe
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('id', brokerId)
      .single();

    if (brokerError || !broker) {
      return res.status(404).json({ error: DomainErrors.NOT_FOUND });
    }

    // Verificar se domínio já existe
    const { data: existingZone } = await supabase
      .from('dns_zones')
      .select('id')
      .eq('domain', normalizedDomain)
      .single();

    if (existingZone) {
      return res.status(409).json({ error: 'Domain already exists' });
    }

    // 1. CRIAR ZONA NO DIGITAL OCEAN
    console.log('Creating DNS zone on Digital Ocean:', normalizedDomain);
    
    const createZoneResponse = await fetch('https://api.digitalocean.com/v2/domains', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: normalizedDomain,
        ip_address: APP_IP
      })
    });

    if (!createZoneResponse.ok) {
      const error = await createZoneResponse.json();
      console.error('Digital Ocean zone creation failed:', error);
      return res.status(500).json({ 
        error: 'Failed to create DNS zone',
        details: error
      });
    }

    const zoneData = await createZoneResponse.json();
    console.log('Zone created successfully:', zoneData);

    // 2. ADICIONAR REGISTROS DNS AUTOMATICAMENTE
    const dnsRecords = [
      {
        type: 'CNAME',
        name: 'www',
        data: `${BASE_DOMAIN}.`,
        ttl: 3600
      },
      {
        type: 'CNAME',
        name: '*',
        data: `${BASE_DOMAIN}.`,
        ttl: 3600
      }
    ];

    for (const record of dnsRecords) {
      const addRecordResponse = await fetch(
        `https://api.digitalocean.com/v2/domains/${normalizedDomain}/records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(record)
        }
      );

      if (!addRecordResponse.ok) {
        console.warn('Failed to add DNS record:', record);
      } else {
        console.log('DNS record added:', record);
      }
    }

    // 3. SALVAR NO BANCO
    const nameservers = [
      'ns1.digitalocean.com',
      'ns2.digitalocean.com',
      'ns3.digitalocean.com'
    ];

    const { data: zone, error: zoneError } = await supabase
      .from('dns_zones')
      .insert({
        broker_id: brokerId,
        domain: normalizedDomain,
        status: 'verifying',
        nameservers
      })
      .select()
      .single();

    if (zoneError) {
      console.error('Failed to save zone to database:', zoneError);
      return res.status(500).json({ error: 'Failed to save zone' });
    }

    // 4. ATUALIZAR CUSTOM_DOMAIN NO BROKER
    await supabase
      .from('brokers')
      .update({ custom_domain: normalizedDomain })
      .eq('id', brokerId);

    // 5. RETORNAR INSTRUÇÕES
    return res.status(200).json({
      success: true,
      domain: normalizedDomain,
      zoneId: zone.id,
      nameservers,
      instructions: {
        title: 'Configure os Nameservers no seu registrador',
        steps: [
          '1. Acesse o painel do seu registrador (GoDaddy, Hostinger, Registro.br, etc)',
          '2. Vá em Configurações de DNS ou Nameservers',
          '3. Altere para "Nameservers Personalizados"',
          '4. Adicione os nameservers abaixo:'
        ],
        nameserversList: nameservers,
        note: 'A propagação dos nameservers leva de 4 a 48 horas. Seu domínio será ativado automaticamente quando estiver pronto.',
        autoVerification: 'Estamos verificando automaticamente a cada 5 minutos.'
      }
    });
  } catch (error) {
    console.error('Error creating DNS zone:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
