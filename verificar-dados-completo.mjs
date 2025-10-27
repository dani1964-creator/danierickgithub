import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verificarDadosCompleto() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DOS DADOS NO SUPABASE\n');
  
  try {
    // 1. Verificar todas as imobiliárias
    const { data: brokers, error: brokersError, count } = await supabase
      .from('brokers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (brokersError) throw brokersError;
    
    console.log(`📊 TOTAL DE BROKERS: ${count} registros encontrados\n`);
    
    if (brokers.length === 0) {
      console.log('❌ NENHUMA IMOBILIÁRIA ENCONTRADA!');
      console.log('   Execute o script "recriar-imobiliarias.sql" no Supabase\n');
      return;
    }
    
    console.log('=== TODAS AS IMOBILIÁRIAS ===');
    brokers.forEach((broker, index) => {
      const tipo = (broker.email === 'erickjq123@gmail.com' || broker.business_name === 'Super Admin') 
        ? '🔧 SUPER ADMIN' 
        : '🏢 IMOBILIÁRIA';
      
      console.log(`${index + 1}. ${tipo}`);
      console.log(`   Nome: ${broker.business_name}`);
      console.log(`   Email: ${broker.email}`);
      console.log(`   User ID: ${broker.user_id}`);
      console.log(`   Slug: ${broker.website_slug}`);
      console.log(`   Ativo: ${broker.is_active ? 'SIM' : 'NÃO'}`);
      console.log(`   Criado: ${new Date(broker.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    // 2. Contar por tipo
    const superAdmins = brokers.filter(b => 
      b.email === 'erickjq123@gmail.com' || b.business_name === 'Super Admin'
    );
    const imobiliarias = brokers.filter(b => 
      b.email !== 'erickjq123@gmail.com' && b.business_name !== 'Super Admin'
    );
    
    console.log('=== RESUMO ===');
    console.log(`🔧 Super Admins: ${superAdmins.length}`);
    console.log(`🏢 Imobiliárias: ${imobiliarias.length}`);
    console.log('');
    
    if (imobiliarias.length === 0) {
      console.log('⚠️  PROBLEMA: Nenhuma imobiliária real encontrada!');
      console.log('   As imobiliárias podem ter sido deletadas.');
      console.log('   Execute: recriar-imobiliarias.sql\n');
    }
    
    // 3. Verificar usuários Auth (apenas alguns campos públicos)
    console.log('=== USUÁRIOS AUTH ===');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao acessar Auth:', authError.message);
    } else {
      console.log(`👥 Total usuários Auth: ${authUsers.users.length}`);
      
      authUsers.users.forEach(user => {
        const brokerMatch = brokers.find(b => b.user_id === user.id);
        console.log(`   📧 ${user.email} (${user.id})`);
        console.log(`      Broker: ${brokerMatch ? brokerMatch.business_name : 'NÃO ENCONTRADO'}`);
        console.log(`      Confirmado: ${user.email_confirmed_at ? 'SIM' : 'NÃO'}`);
        console.log('');
      });
    }
    
    // 4. Verificar corretores da R&F
    const rfBroker = brokers.find(b => 
      b.email === 'danierick.erick@hotmail.com' || 
      b.business_name?.toLowerCase().includes('r&f')
    );
    
    if (rfBroker) {
      console.log('=== CORRETORES DA R&F ===');
      const { data: realtors, error: realtorsError } = await supabase
        .from('realtors')
        .select('*')
        .eq('broker_id', rfBroker.id);
      
      if (realtorsError) {
        console.log('❌ Erro ao buscar corretores:', realtorsError.message);
      } else {
        console.log(`👨‍💼 Total corretores R&F: ${realtors.length}`);
        
        if (realtors.length === 0) {
          console.log('⚠️  Nenhum corretor encontrado para R&F!');
          console.log('   Execute a parte de criar corretores no script SQL');
        } else {
          realtors.forEach((realtor, index) => {
            console.log(`${index + 1}. ${realtor.name}`);
            console.log(`   Email: ${realtor.email}`);
            console.log(`   Telefone: ${realtor.phone}`);
            console.log(`   CRECI: ${realtor.creci_number}`);
            console.log(`   Ativo: ${realtor.is_active ? 'SIM' : 'NÃO'}`);
            console.log('');
          });
        }
      }
    } else {
      console.log('❌ R&F Imobiliária não encontrada!');
    }
    
    // 5. Verificar se existem as 5 imobiliárias esperadas
    console.log('=== VERIFICAÇÃO DAS 5 IMOBILIÁRIAS ESPERADAS ===');
    const expectedEmails = [
      'bucosistyle@hotmail.com',
      'erickjq11@gmail.com', 
      'erickp2032@gmail.com',
      'pedrodesousakiske@gmail.com',
      'danierick.erick@hotmail.com'
    ];
    
    expectedEmails.forEach((email, index) => {
      const found = imobiliarias.find(b => b.email === email);
      console.log(`${index + 1}. ${email}: ${found ? '✅ ENCONTRADA' : '❌ NÃO ENCONTRADA'}`);
      if (found) {
        console.log(`   Nome: ${found.business_name}`);
        console.log(`   Ativo: ${found.is_active ? 'SIM' : 'NÃO'}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
  }
}

verificarDadosCompleto();