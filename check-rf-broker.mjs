import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkBrokerData() {
  console.log('🔍 Verificando dados das imobiliárias...\n');
  
  try {
    // Buscar todos os brokers
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (brokersError) {
      throw brokersError;
    }
    
    console.log('📊 Imobiliárias encontradas:', brokers.length);
    console.log('\n=== DADOS DAS IMOBILIÁRIAS ===\n');
    
    brokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.business_name}`);
      console.log(`   Email: ${broker.email}`);
      console.log(`   User ID: ${broker.user_id}`);
      console.log(`   Display Name: ${broker.display_name}`);
      console.log(`   Website Slug: ${broker.website_slug}`);
      console.log(`   Ativo: ${broker.is_active ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${new Date(broker.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    // Buscar especificamente a R&F
    const rfBroker = brokers.find(b => 
      b.business_name?.toLowerCase().includes('r&f') || 
      b.business_name?.toLowerCase().includes('rf')
    );
    
    if (rfBroker) {
      console.log('🎯 IMOBILIÁRIA R&F ENCONTRADA:');
      console.log('   ID:', rfBroker.id);
      console.log('   Email atual:', rfBroker.email);
      console.log('   Email esperado: danierick.erick@hotmail.com');
      console.log('   User ID:', rfBroker.user_id);
      
      if (rfBroker.email !== 'danierick.erick@hotmail.com') {
        console.log('\n⚠️  EMAIL INCONSISTENTE DETECTADO!');
        console.log('   Email atual:', rfBroker.email);
        console.log('   Email correto deveria ser: danierick.erick@hotmail.com');
        
        // Verificar se existe usuário auth com o email correto
        console.log('\n🔍 Verificando usuário no Supabase Auth...');
        
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('❌ Erro ao listar usuários auth:', authError.message);
        } else {
          const danierickUser = authUsers.users.find(u => u.email === 'danierick.erick@hotmail.com');
          
          if (danierickUser) {
            console.log('✅ Usuário danierick.erick@hotmail.com encontrado no Auth');
            console.log('   Auth User ID:', danierickUser.id);
            console.log('   Email confirmado:', danierickUser.email_confirmed_at ? 'Sim' : 'Não');
            
            if (rfBroker.user_id !== danierickUser.id) {
              console.log('\n🔧 CORREÇÃO NECESSÁRIA:');
              console.log(`   Atualizar broker.email de "${rfBroker.email}" para "danierick.erick@hotmail.com"`);
              console.log(`   Verificar se broker.user_id "${rfBroker.user_id}" deve ser "${danierickUser.id}"`);
            } else {
              console.log('✅ User ID está correto, apenas o email precisa ser atualizado');
            }
          } else {
            console.log('❌ Usuário danierick.erick@hotmail.com NÃO encontrado no Auth');
          }
        }
      } else {
        console.log('✅ Email da R&F está correto!');
      }
    } else {
      console.log('❌ Imobiliária R&F não encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  }
}

checkBrokerData();