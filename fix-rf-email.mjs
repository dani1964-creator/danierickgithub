import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRFBrokerEmail() {
  try {
    console.log('🔧 Iniciando correção do email da R&F Imobiliária...\n');
    
    // 1. Buscar a imobiliária R&F
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('*');
    
    if (brokersError) throw brokersError;
    
    console.log(`📊 Total de imobiliárias encontradas: ${brokers.length}`);
    
    // Buscar por R&F ou RF na business_name
    const rfBroker = brokers.find(b => 
      b.business_name && (
        b.business_name.toLowerCase().includes('r&f') || 
        b.business_name.toLowerCase().includes('rf') ||
        b.business_name.toLowerCase().includes('r f')
      )
    );
    
    if (!rfBroker) {
      console.log('❌ Imobiliária R&F não encontrada');
      return;
    }
    
    console.log('🎯 Imobiliária R&F encontrada:');
    console.log(`   ID: ${rfBroker.id}`);
    console.log(`   Nome: ${rfBroker.business_name}`);
    console.log(`   Email atual: ${rfBroker.email}`);
    console.log(`   User ID: ${rfBroker.user_id}`);
    
    // 2. Verificar se já tem o email correto
    const correctEmail = 'danierick.erick@hotmail.com';
    
    if (rfBroker.email === correctEmail) {
      console.log('✅ Email já está correto!');
      return;
    }
    
    // 3. Verificar se existe o usuário auth com o email correto
    console.log('\n🔍 Verificando usuário no Supabase Auth...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }
    
    const danierickUser = authUsers.users.find(u => u.email === correctEmail);
    
    if (!danierickUser) {
      console.log('❌ Usuário danierick.erick@hotmail.com não encontrado no Auth');
      return;
    }
    
    console.log('✅ Usuário encontrado no Auth:');
    console.log(`   Auth User ID: ${danierickUser.id}`);
    console.log(`   Email: ${danierickUser.email}`);
    
    // 4. Atualizar o email da imobiliária
    console.log('\n🔧 Atualizando email da imobiliária...');
    
    const { data: updatedBroker, error: updateError } = await supabase
      .from('brokers')
      .update({ 
        email: correctEmail,
        user_id: danierickUser.id // Garantir que o user_id também está correto
      })
      .eq('id', rfBroker.id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('✅ Email corrigido com sucesso!');
    console.log('📋 Dados atualizados:');
    console.log(`   ID: ${updatedBroker.id}`);
    console.log(`   Nome: ${updatedBroker.business_name}`);
    console.log(`   Email: ${updatedBroker.email}`);
    console.log(`   User ID: ${updatedBroker.user_id}`);
    
    console.log('\n🎉 Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  }
}

fixRFBrokerEmail();