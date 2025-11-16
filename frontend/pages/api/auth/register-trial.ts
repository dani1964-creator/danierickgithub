import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * API para auto-cadastro com trial de 30 dias
 * POST /api/auth/register-trial
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessName, ownerName, email, password } = req.body;

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
    const { data: broker, error: brokerError } = await supabaseAdmin
      .from('brokers')
      .insert({
        user_id: userId,
        business_name: businessName,
        owner_name: ownerName,
        email: email,
        website_slug: websiteSlug,
        is_active: true,
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      })
      .select()
      .single();

    if (brokerError || !broker) {
      console.error('Broker error:', brokerError);
      // Deletar usuário se falhar ao criar broker
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Erro ao criar imobiliária' });
    }

    // 4. Criar assinatura em trial
    const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        broker_id: broker.id,
        plan_type: 'trial',
        status: 'trial',
        trial_start_date: new Date().toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        monthly_price_cents: 0,
        notes: `Conta criada via auto-cadastro em ${new Date().toLocaleDateString('pt-BR')}. Trial de 30 dias.`,
      });

    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
      // Não vamos reverter, mas vamos logar o erro
      // A subscription pode ser criada manualmente depois
    }

    // 5. Enviar email de boas-vindas (não bloqueia o cadastro se falhar)
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
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erro interno ao processar cadastro' });
  }
}
