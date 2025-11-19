import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DO_ACCESS_TOKEN = process.env.DO_ACCESS_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brokerId } = req.body;

  if (!brokerId) {
    return res.status(400).json({ error: 'brokerId é obrigatório' });
  }

  try {
    // 1. Buscar a zona DNS do broker
    const { data: zone, error: zoneError } = await supabase
      .from('dns_zones')
      .select('*')
      .eq('broker_id', brokerId)
      .single();

    if (zoneError || !zone) {
      return res.status(404).json({ error: 'Zona DNS não encontrada' });
    }

    // 2. Deletar zona no Digital Ocean (se token disponível)
    if (DO_ACCESS_TOKEN) {
      try {
        const doResponse = await fetch(`https://api.digitalocean.com/v2/domains/${zone.domain}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${DO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!doResponse.ok && doResponse.status !== 404) {
          console.error('Erro ao deletar zona no Digital Ocean:', doResponse.status);
          // Continua mesmo se falhar no DO, pois queremos limpar o banco
        }
      } catch (doError) {
        console.error('Erro na requisição para Digital Ocean:', doError);
        // Continua mesmo se falhar
      }
    }

    // 3. Deletar registros DNS relacionados
    const { error: recordsError } = await supabase
      .from('dns_records')
      .delete()
      .eq('zone_id', zone.id);

    if (recordsError) {
      console.error('Erro ao deletar registros DNS:', recordsError);
    }

    // 4. Deletar a zona do banco (isso vai acionar o trigger que limpa custom_domain)
    const { error: deleteError } = await supabase
      .from('dns_zones')
      .delete()
      .eq('id', zone.id);

    if (deleteError) {
      return res.status(500).json({ error: 'Erro ao deletar zona DNS', details: deleteError });
    }

    // 5. Limpar custom_domain manualmente (caso trigger não tenha executado)
    await supabase
      .from('brokers')
      .update({ custom_domain: null })
      .eq('id', brokerId);

    return res.status(200).json({ 
      success: true, 
      message: 'Domínio personalizado removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar domínio:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao deletar domínio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
