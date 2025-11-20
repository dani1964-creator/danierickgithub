import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase com service_role para bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron Job: Verifica nameservers de todas as zonas pendentes
 * 
 * Configuração no Digital Ocean App Platform:
 * 1. Criar Cron Job
 * 2. Schedule: a cada 5 minutos
 * 3. Command: curl -X POST https://seuapp.ondigitalocean.app/api/cron/verify-nameservers
 * 
 * Ou usar serviço externo como cron-job.org
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificação de segurança: aceita apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificação de autenticação: requer token secreto
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[CRON] Iniciando verificação de nameservers...');

    // Buscar todas as zonas com status 'verifying'
    const { data: zones, error: zonesError } = await supabase
      .from('dns_zones')
      .select('id, domain, nameservers, verification_attempts')
      .eq('status', 'verifying');

    if (zonesError) {
      console.error('[CRON] Erro ao buscar zonas:', zonesError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!zones || zones.length === 0) {
      console.log('[CRON] Nenhuma zona pendente de verificação');
      return res.status(200).json({ 
        success: true, 
        message: 'Nenhuma zona pendente',
        verified: 0
      });
    }

    console.log(`[CRON] Encontradas ${zones.length} zonas para verificar`);

    let verifiedCount = 0;
    let failedCount = 0;

    // Verificar cada zona
    for (const zone of zones) {
      console.log(`[CRON] Verificando zona: ${zone.domain}`);

      try {
        // Consultar nameservers via Google DNS API
        const dnsResponse = await fetch(
          `https://dns.google/resolve?name=${zone.domain}&type=NS`
        );
        const dnsData = await dnsResponse.json();

        console.log(`[CRON] DNS Status para ${zone.domain}: ${dnsData.Status}`);

        // Status 3 = NXDOMAIN (nameservers não configurados ainda)
        if (dnsData.Status === 3) {
          console.log(`[CRON] ⏳ Zona ${zone.domain} ainda sem nameservers (tentativa ${zone.verification_attempts + 1})`);
          
          const newAttempts = zone.verification_attempts + 1;
          const newStatus = newAttempts >= 288 ? 'failed' : 'verifying';

          await supabase
            .from('dns_zones')
            .update({
              status: newStatus,
              last_verification_at: new Date().toISOString(),
              verification_attempts: newAttempts
            })
            .eq('id', zone.id);

          if (newStatus === 'failed') {
            failedCount++;
            console.log(`[CRON] ❌ Zona ${zone.domain} marcada como falha (timeout 24h sem nameservers)`);
          }
          continue;
        }

        // Verificar se nameservers apontam para Digital Ocean
        const hasDigitalOceanNS = dnsData.Answer?.some((answer: any) => 
          answer.data?.toLowerCase().includes('digitalocean.com')
        );

        if (hasDigitalOceanNS) {
          // Nameservers configurados corretamente - ativar zona
          console.log(`[CRON] ✅ Zona ${zone.domain} verificada com sucesso!`);

          const { error: updateError } = await supabase
            .from('dns_zones')
            .update({
              status: 'active',
              activated_at: new Date().toISOString(),
              last_verification_at: new Date().toISOString(),
              verification_attempts: zone.verification_attempts + 1
            })
            .eq('id', zone.id);

          if (updateError) {
            console.error(`[CRON] Erro ao atualizar zona ${zone.domain}:`, updateError);
          } else {
            verifiedCount++;
            
            // Adicionar domínio ao App Platform para provisionar SSL automaticamente
            try {
              console.log(`[CRON] 🔒 Adicionando ${zone.domain} ao App Platform para SSL...`);
              
              const addDomainResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://whale-app-w84mh.ondigitalocean.app'}/api/domains/do-add-to-app`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ domain: zone.domain }),
              });

              if (addDomainResponse.ok) {
                const result = await addDomainResponse.json();
                console.log(`[CRON] ✅ Domínio ${zone.domain} adicionado ao App Platform:`, result.message);
              } else {
                const error = await addDomainResponse.json();
                console.error(`[CRON] ⚠️ Erro ao adicionar domínio ao App Platform:`, error);
              }
            } catch (appError) {
              console.error(`[CRON] ⚠️ Falha ao adicionar ${zone.domain} ao App Platform:`, appError);
              // Não falhar a verificação se apenas o SSL falhar
            }
          }
        } else {
          // Nameservers ainda não propagaram
          console.log(`[CRON] ⏳ Zona ${zone.domain} ainda não propagou (tentativa ${zone.verification_attempts + 1})`);

          // Incrementar contador de tentativas
          const newAttempts = zone.verification_attempts + 1;
          
          // Se passou de 288 tentativas (24 horas com verificação a cada 5 min), marcar como falha
          const newStatus = newAttempts >= 288 ? 'failed' : 'verifying';

          const { error: updateError } = await supabase
            .from('dns_zones')
            .update({
              status: newStatus,
              last_verification_at: new Date().toISOString(),
              verification_attempts: newAttempts
            })
            .eq('id', zone.id);

          if (updateError) {
            console.error(`[CRON] Erro ao atualizar tentativas de ${zone.domain}:`, updateError);
          }

          if (newStatus === 'failed') {
            failedCount++;
            console.log(`[CRON] ❌ Zona ${zone.domain} marcada como falha (timeout 24h)`);
          }
        }
      } catch (error) {
        console.error(`[CRON] Erro ao verificar zona ${zone.domain}:`, error);
      }

      // Pequeno delay entre verificações para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[CRON] Verificação concluída: ${verifiedCount} ativadas, ${failedCount} falhadas`);

    return res.status(200).json({
      success: true,
      message: 'Verificação concluída',
      verified: verifiedCount,
      failed: failedCount,
      total: zones.length
    });

  } catch (error) {
    console.error('[CRON] Erro geral:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
