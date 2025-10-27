// create-supabase-admin.js
// Script para criar usuário Super Admin no Supabase Auth + registro na tabela brokers

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Credenciais do admin (mesmas do .env)
const ADMIN_EMAIL = process.env.VITE_SA_EMAIL || 'erickjq123@gmail.com';
const ADMIN_PASSWORD = process.env.VITE_SA_PASSWORD || 'Danis0133.';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no ambiente.');
  console.log('📋 Valores encontrados:');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✅ Definido' : '❌ Não definido');
  console.log('   SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅ Definido' : '❌ Não definido');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdminUser() {
  console.log('🚀 Iniciando criação do usuário Super Admin...');
  console.log('📧 Email:', ADMIN_EMAIL);
  console.log('🔐 Senha:', ADMIN_PASSWORD.substring(0, 3) + '***' + ADMIN_PASSWORD.slice(-1));
  console.log('');

  try {
    // 1) Verificar se o usuário já existe
    console.log('🔍 Verificando se usuário já existe...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const existingUser = existingUsers.users?.find(user => user.email === ADMIN_EMAIL);
    
    if (existingUser) {
      console.log('⚠️  Usuário já existe no Auth:', existingUser.id);
      
      // Verificar se tem registro na tabela brokers
      const { data: brokerData, error: brokerCheckError } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();

      if (brokerCheckError && brokerCheckError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar broker:', brokerCheckError.message);
        return;
      }

      if (brokerData) {
        console.log('✅ Registro broker já existe:', brokerData.business_name);
        console.log('🎉 Setup completo! Usuário pronto para usar.');
        return;
      } else {
        console.log('📝 Criando registro broker para usuário existente...');
        await createBrokerRecord(existingUser.id);
        return;
      }
    }

    // 2) Criar novo usuário no Auth
    console.log('➕ Criando novo usuário no Supabase Auth...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Marca como confirmado automaticamente
      user_metadata: {
        business_name: 'Super Admin',
        display_name: 'Administrador do Sistema'
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return;
    }

    const user = data.user;
    console.log('✅ Usuário criado com sucesso!');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('');

    // 3) Criar registro na tabela brokers
    await createBrokerRecord(user.id);

  } catch (err) {
    console.error('💥 Erro inesperado:', err.message);
  }
}

async function createBrokerRecord(userId) {
  console.log('📝 Criando registro na tabela brokers...');

  const brokerPayload = {
    user_id: userId,
    email: ADMIN_EMAIL,
    business_name: 'Super Admin',
    display_name: 'Administrador do Sistema',
    website_slug: 'admin',
    phone: '+55 11 99999-9999',
    whatsapp_number: '+55 11 99999-9999',
    contact_email: ADMIN_EMAIL,
    is_active: true,
    plan_type: 'enterprise',
    max_properties: 999999
  };

  const { data: brokerData, error: brokerError } = await supabase
    .from('brokers')
    .upsert(brokerPayload, { onConflict: 'user_id' })
    .select()
    .single();

  if (brokerError) {
    console.error('❌ Erro ao criar registro broker:', brokerError.message);
    return;
  }

  console.log('✅ Registro broker criado/atualizado!');
  console.log('   ID:', brokerData.id);
  console.log('   Business Name:', brokerData.business_name);
  console.log('   Email:', brokerData.email);
  console.log('');
  console.log('🎉 Setup completo! Agora você pode fazer login em /admin com:');
  console.log('   📧 Email:', ADMIN_EMAIL);
  console.log('   🔐 Senha:', ADMIN_PASSWORD.substring(0, 3) + '***' + ADMIN_PASSWORD.slice(-1));
}

// Executar script
createAdminUser()
  .then(() => {
    console.log('✨ Script finalizado!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Falha no script:', err);
    process.exit(1);
  });

export { createAdminUser };