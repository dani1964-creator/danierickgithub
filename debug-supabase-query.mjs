import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugSupabaseQuery() {
  console.log('🔍 DEBUG: Testando query do SuperAdmin...\n');
  
  try {
    // 1. Testar a query exata do useOptimizedBrokers
    console.log('=== QUERY EXATA DO useOptimizedBrokers ===');
    const { data: brokersData, error: brokersError, count } = await supabase
      .from('brokers')
      .select('id, user_id, business_name, display_name, email, website_slug, is_active, plan_type, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 49); // 50 items (0-49)
    
    if (brokersError) {
      console.error('❌ ERRO na query:', brokersError);
      return;
    }
    
    console.log(`📊 TOTAL ENCONTRADO: ${count} registros`);
    console.log(`📋 RETORNADOS: ${brokersData?.length} registros`);
    console.log('');
    
    if (!brokersData || brokersData.length === 0) {
      console.log('❌ NENHUM DADO RETORNADO!');
      
      // Testar query mais simples
      console.log('\n=== TESTANDO QUERY SIMPLES ===');
      const { data: simpleData, error: simpleError } = await supabase
        .from('brokers')
        .select('*');
      
      if (simpleError) {
        console.error('❌ ERRO na query simples:', simpleError);
      } else {
        console.log(`📊 Query simples retornou: ${simpleData?.length} registros`);
        simpleData?.forEach((broker, index) => {
          console.log(`${index + 1}. ${broker.business_name} (${broker.email})`);
        });
      }
      return;
    }
    
    // 2. Listar todos os brokers encontrados
    console.log('=== TODOS OS BROKERS ENCONTRADOS ===');
    brokersData.forEach((broker, index) => {
      const isSuperAdmin = broker.email === 'erickjq123@gmail.com' || broker.business_name === 'Super Admin';
      console.log(`${index + 1}. [${isSuperAdmin ? 'SUPER ADMIN' : 'IMOBILIÁRIA'}] ${broker.business_name}`);
      console.log(`   Email: ${broker.email}`);
      console.log(`   User ID: ${broker.user_id}`);
      console.log(`   Ativo: ${broker.is_active}`);
      console.log(`   Slug: ${broker.website_slug}`);
      console.log('');
    });
    
    // 3. Aplicar o filtro que está no código
    const SUPER_ADMIN_EMAIL = 'erickjq123@gmail.com';
    const filteredBrokers = brokersData.filter(broker => 
      broker.email !== SUPER_ADMIN_EMAIL && 
      broker.business_name !== 'Super Admin'
    );
    
    console.log('=== APÓS FILTRAR SUPER ADMIN ===');
    console.log(`📊 IMOBILIÁRIAS FILTRADAS: ${filteredBrokers.length}`);
    
    if (filteredBrokers.length === 0) {
      console.log('❌ NENHUMA IMOBILIÁRIA APÓS FILTRO!');
      console.log('   Problema: Todos os registros são Super Admin ou foram filtrados');
    } else {
      filteredBrokers.forEach((broker, index) => {
        console.log(`${index + 1}. ${broker.business_name}`);
        console.log(`   Email: ${broker.email}`);
        console.log(`   Ativo: ${broker.is_active}`);
        console.log('');
      });
    }
    
    // 4. Verificar se tem as 5 imobiliárias esperadas
    console.log('=== VERIFICAÇÃO DAS 5 IMOBILIÁRIAS ESPERADAS ===');
    const expectedEmails = [
      'bucosistyle@hotmail.com',
      'erickjq11@gmail.com', 
      'erickp2032@gmail.com',
      'pedrodesousakiske@gmail.com',
      'danierick.erick@hotmail.com'
    ];
    
    expectedEmails.forEach((email, index) => {
      const found = brokersData.find(b => b.email === email);
      console.log(`${index + 1}. ${email}: ${found ? '✅ ENCONTRADA' : '❌ NÃO ENCONTRADA'}`);
      if (found) {
        console.log(`   Nome: ${found.business_name}`);
        console.log(`   Ativo: ${found.is_active}`);
        console.log(`   User ID: ${found.user_id}`);
      }
      console.log('');
    });
    
    // 5. Testar conexão com cliente normal (não service role)
    console.log('=== TESTANDO COM CLIENTE NORMAL (sem service role) ===');
    const normalClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || '');
    
    const { data: normalData, error: normalError } = await normalClient
      .from('brokers')
      .select('id, business_name, email, is_active')
      .limit(10);
    
    if (normalError) {
      console.log('❌ Cliente normal falhou:', normalError.message);
      console.log('   Isso pode indicar problema de RLS ou permissões');
    } else {
      console.log(`✅ Cliente normal retornou: ${normalData?.length} registros`);
    }
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
  }
}

debugSupabaseQuery();