import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validar variáveis de ambiente
if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não está configurada!');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não está configurada!');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * API para auto-cadastro com trial de 30 dias
 * POST /api/auth/register-trial
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar variáveis de ambiente
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente não configuradas:', {
      hasUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
    });
    return res.status(500).json({ 
      error: 'Configuração do servidor incompleta. Contate o administrador.',
      details: 'Variáveis de ambiente não configuradas'
    });
  }

  try {
    const { businessName, ownerName, email, password } = req.body;
    
    console.log('📝 Iniciando cadastro para:', { businessName, ownerName, email });

    // Validações
    if (!businessName || !ownerName || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // 1. Criar usuário no Supabase Auth (já verifica email duplicado)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: ownerName,
        business_name: businessName,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return res.status(400).json({ error: authError?.message || 'Erro ao criar usuário' });
    }

    const userId = authData.user.id;

    // 2. Criar slug único para a imobiliária
    const baseSlug = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens das extremidades

    // Verificar se slug já existe e adicionar número se necessário
    let websiteSlug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const { data: existing } = await supabaseAdmin
        .from('brokers')
        .select('id')
        .eq('website_slug', websiteSlug)
        .single();

      if (!existing) {
        slugExists = false;
      } else {
        websiteSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // 3. Criar broker
    console.log('📝 Tentando criar broker com dados:', {
      user_id: userId,
      business_name: businessName,
      display_name: ownerName,
      email: email,
      website_slug: websiteSlug,
    });

    const { data: broker, error: brokerError } = await supabaseAdmin
      .from('brokers')
      .insert({
        user_id: userId,
        business_name: businessName,
        display_name: ownerName,
        email: email,
        website_slug: websiteSlug,
        is_active: true,
      })
      .select()
      .single();

    if (brokerError || !broker) {
      console.error('❌ Broker error DETALHADO:', {
        error: brokerError,
        message: brokerError?.message,
        details: brokerError?.details,
        hint: brokerError?.hint,
        code: brokerError?.code,
      });
      // Deletar usuário se falhar ao criar broker
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ 
        error: 'Erro ao criar imobiliária',
        details: brokerError?.message,
        hint: brokerError?.hint,
      });
    }

    console.log('✅ Broker criado com sucesso:', broker.id);

    // 4. Criar assinatura em trial usando a função do banco
    console.log('📝 Tentando inicializar subscription trial para broker:', broker.id);
    
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .rpc('initialize_subscription_trial', {
        broker_uuid: broker.id
      });

    if (subscriptionError) {
      console.error('❌ Subscription error DETALHADO:', {
        error: subscriptionError,
        message: subscriptionError?.message,
        details: subscriptionError?.details,
        hint: subscriptionError?.hint,
        code: subscriptionError?.code,
      });
      // Não vamos reverter, mas vamos logar o erro
      // A subscription pode ser criada manualmente depois
    } else {
      console.log('✅ Subscription criada com sucesso:', subscriptionData);
    }

    // 5. Enviar email de boas-vindas (não bloqueia o cadastro se falhar)
    const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          email,
          businessName,
          ownerName,
          websiteSlug,
          trialEndsAt: trialEndDate.toISOString(),
        }),
      });
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Não bloqueamos o cadastro por erro no email
    }

    // 6. Retornar sucesso
    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso! Você ganhou 30 dias grátis.',
      data: {
        userId,
        brokerId: broker.id,
        websiteSlug,
        trialEndsAt: trialEndDate.toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Registration error COMPLETO:', {
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ 
      error: 'Erro interno ao processar cadastro',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}