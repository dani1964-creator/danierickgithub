require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🔧 PADRONIZANDO STATUS DE TODAS AS IMOBILIÁRIAS');
  console.log('');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role para poder alterar tudo
  );

  // 1. Verificar status atual
  console.log('1️⃣ STATUS ATUAL DOS BROKERS:');
  const { data: brokers, error: fetchError } = await supabase
    .from('brokers')
    .select('id, business_name, email, status, is_active')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.log('❌ Erro ao buscar brokers:', fetchError.message);
    return;
  }

  brokers.forEach((broker, i) => {
    console.log(`   ${i+1}. ${broker.business_name} (${broker.email})`);
    console.log(`      Status: ${broker.status || 'NULL'}`);
    console.log(`      Is Active: ${broker.is_active}`);
    console.log('');
  });

  // 2. Padronizar TODOS para status: 'active'
  console.log('2️⃣ PADRONIZANDO TODOS PARA status = "active":');
  
  for (const broker of brokers) {
    if (broker.status !== 'active') {
      console.log(`🔄 Atualizando ${broker.business_name}...`);
      
      const { error: updateError } = await supabase
        .from('brokers')
        .update({ 
          status: 'active',
          is_active: true, // Garantir que também está ativo
          updated_at: new Date().toISOString()
        })
        .eq('id', broker.id);

      if (updateError) {
        console.log(`❌ Erro ao atualizar ${broker.business_name}:`, updateError.message);
      } else {
        console.log(`✅ ${broker.business_name} atualizado com sucesso!`);
      }
    } else {
      console.log(`✅ ${broker.business_name} já está com status 'active'`);
    }
  }

  // 3. Verificar resultado final
  console.log('');
  console.log('3️⃣ VERIFICANDO RESULTADO FINAL:');
  
  const { data: finalBrokers, error: finalError } = await supabase
    .from('brokers')
    .select('id, business_name, email, status, is_active')
    .order('created_at', { ascending: false });

  if (finalError) {
    console.log('❌ Erro na verificação final:', finalError.message);
    return;
  }

  console.log(`📊 Total de brokers: ${finalBrokers.length}`);
  finalBrokers.forEach((broker, i) => {
    console.log(`   ${i+1}. ${broker.business_name}`);
    console.log(`      Status: ${broker.status || 'NULL'} | Active: ${broker.is_active}`);
  });

  console.log('');
  console.log('🎯 PADRONIZAÇÃO CONCLUÍDA!');
  console.log('💡 Agora teste o SuperAdmin - todas devem aparecer!');
})();