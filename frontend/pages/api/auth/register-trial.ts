import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * API para auto-cadastro com trial de 30 dias
 * POST /api/auth/register-trial
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validar variáveis de ambiente DENTRO da função
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ [REGISTER] Variáveis de ambiente não configuradas:', {
      timestamp: new Date().toISOString(),
      hasUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
    });
    return res.status(500).json({ 
      error: 'Configuração do servidor incompleta',
      code: 'ENV_NOT_CONFIGURED'
    });
  }

  // Criar client Supabase APÓS validação, com configurações otimizadas
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { businessName, ownerName, email, password } = req.body;
    
    console.log('📝 [REGISTER] Iniciando cadastro:', { 
      businessName, 
      ownerName, 
      email,
      timestamp: new Date().toISOString()
    });

    // Validações
    if (!businessName || !ownerName || !email || !password) {
      console.warn('⚠️ [REGISTER] Campos obrigatórios faltando');
      return res.status(400).json({ 
        error: 'Todos os campos são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('⚠️ [REGISTER] Email inválido:', email);
      return res.status(400).json({ 
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'A senha deve ter pelo menos 6 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }

    // 1. Criar usuário no Supabase Auth
    console.log('🔐 [REGISTER] Criando usuário...');
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
      console.error('❌ [REGISTER] Auth error:', {
        error: authError,
        message: authError?.message,
      });
      
      if (authError?.message?.includes('already registered')) {
        return res.status(400).json({ 
          error: 'Este email já está cadastrado',
          code: 'EMAIL_EXISTS'
        });
      }
      
      return res.status(400).json({ 
        error: authError?.message || 'Erro ao criar usuário',
        code: 'AUTH_ERROR'
      });
    }

    const userId = authData.user.id;
    console.log('✅ [REGISTER] Usuário criado:', userId);

    // 2. Gerar slug único
    console.log('🔤 [REGISTER] Gerando slug...');
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
      const { data: existing, error: slugError } = await supabaseAdmin
        .from('brokers')
        .select('id')
        .eq('website_slug', websiteSlug)
        .maybeSingle();

      if (slugError) {
        console.error('❌ [REGISTER] Erro ao verificar slug:', slugError);
        throw new Error(`Erro ao verificar slug: ${slugError.message}`);
      }

      if (!existing) {
        slugExists = false;
      } else {
        websiteSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    console.log('✅ [REGISTER] Slug gerado:', websiteSlug);

    // 3. Criar broker
    console.log('🏢 [REGISTER] Criando broker...');

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
      console.error('❌ [REGISTER] Broker error:', {
        error: brokerError,
        message: brokerError?.message,
        details: brokerError?.details,
        hint: brokerError?.hint,
        code: brokerError?.code,
      });
      
      // Rollback: Deletar usuário
      console.log('🔄 [REGISTER] Revertendo usuário...');
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return res.status(500).json({ 
        error: 'Erro ao criar imobiliária',
        details: brokerError?.message,
        hint: brokerError?.hint,
        code: 'BROKER_CREATE_ERROR'
      });
    }

    console.log('✅ [REGISTER] Broker criado:', broker.id);

    // 4. Criar assinatura em trial
    console.log('💳 [REGISTER] Criando subscription...');
    
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .rpc('initialize_subscription_trial', {
        broker_uuid: broker.id
      });

    if (subscriptionError) {
      console.error('❌ [REGISTER] Subscription error:', {
        error: subscriptionError,
        message: subscriptionError?.message,
        brokerId: broker.id,
      });
      // Não bloqueamos o cadastro
    } else {
      console.log('✅ [REGISTER] Subscription criada:', subscriptionData);
    }

    // 5. Email de boas-vindas (não-bloqueante)
    const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    console.log('📧 [REGISTER] Enviando email...');
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
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
      });
      console.log('✅ [REGISTER] Email enviado');
    } catch (emailError) {
      console.warn('⚠️ [REGISTER] Erro no email (não-crítico):', 
        emailError instanceof Error ? emailError.message : 'Erro desconhecido'
      );
      // Não bloqueamos o cadastro por erro no email
    }

    // 6. Retornar sucesso
    console.log('🎉 [REGISTER] Cadastro concluído!', {
      userId,
      brokerId: broker.id,
      websiteSlug,
    });
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
    console.error('❌ [REGISTER] ERRO NÃO TRATADO:', {
      timestamp: new Date().toISOString(),
      error: error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ 
      error: 'Erro interno ao processar cadastro',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      code: 'INTERNAL_ERROR'
    });
  }
}