import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DO_ACCESS_TOKEN = process.env.DO_ACCESS_TOKEN;

/**
 * API para adicionar registros DNS customizados
 * 
 * POST /api/domains/do-add-record
 * Body: { 
 *   zoneId: string,
 *   recordType: 'MX' | 'CNAME' | 'A' | 'TXT',
 *   name: string,
 *   value: string,
 *   priority?: number (para MX)
 * }
 * 
 * Permite cliente adicionar:
 * - MX records para email
 * - Subdomínios (CNAME/A)
 * - Registros TXT (SPF, DKIM, etc)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DO_ACCESS_TOKEN) {
    return res.status(503).json({ error: 'Digital Ocean API not configured' });
  }

  try {
    const { zoneId, recordType, name, value, priority, ttl = 3600 } = req.body;

    // Validações
    if (!zoneId || !recordType || !name || !value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['MX', 'CNAME', 'A', 'TXT', 'AAAA'];
    if (!validTypes.includes(recordType)) {
      return res.status(400).json({ error: 'Invalid record type' });
    }

    if (recordType === 'MX' && !priority) {
      return res.status(400).json({ error: 'Priority is required for MX records' });
    }

    // Buscar zona
    const { data: zone, error: zoneError } = await supabase
      .from('dns_zones')
      .select('*')
      .eq('id', zoneId)
      .single();

    if (zoneError || !zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Verificar se zona está ativa
    if (zone.status !== 'active') {
      return res.status(400).json({ 
        error: 'Zone is not active yet',
        message: 'Wait for nameservers to propagate before adding records'
      });
    }

    // Adicionar registro no Digital Ocean
    const recordData: any = {
      type: recordType,
      name: name === '@' ? '@' : name,
      data: value,
      ttl
    };

    if (recordType === 'MX') {
      recordData.priority = priority;
    }

    const doResponse = await fetch(
      `https://api.digitalocean.com/v2/domains/${zone.domain}/records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      }
    );

    if (!doResponse.ok) {
      const error = await doResponse.json();
      console.error('Digital Ocean add record failed:', error);
      return res.status(500).json({ 
        error: 'Failed to add DNS record',
        details: error
      });
    }

    const doData = await doResponse.json();

    // Salvar no banco
    const { data: record, error: recordError } = await supabase
      .from('dns_records')
      .insert({
        zone_id: zoneId,
        record_type: recordType,
        name,
        value,
        priority: recordType === 'MX' ? priority : null,
        ttl,
        created_by: req.headers['x-user-id'] // Se tiver auth
      })
      .select()
      .single();

    if (recordError) {
      console.error('Failed to save record to database:', recordError);
      return res.status(500).json({ error: 'Failed to save record' });
    }

    return res.status(200).json({
      success: true,
      record: {
        id: record.id,
        type: recordType,
        name,
        value,
        priority,
        ttl
      },
      digitalOceanRecordId: doData.domain_record?.id,
      message: 'DNS record added successfully'
    });
  } catch (error) {
    console.error('Error adding DNS record:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
