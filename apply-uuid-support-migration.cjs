const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔄 Aplicando migration para suporte a UUID em property_slug...\n');
  
  const migrationSQL = fs.readFileSync(
    '../supabase/migrations/20251111030000_support_uuid_in_property_detail.sql',
    'utf8'
  );
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });
  
  if (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    
    // Tentar executar diretamente via API
    console.log('\n🔄 Tentando executar migration usando from().select()...\n');
    
    const { error: directError } = await supabase
      .from('_realtime')
      .select('*')
      .limit(0);
    
    console.log('\n⚠️  Não foi possível aplicar a migration automaticamente.');
    console.log('📋 Execute este SQL manualmente no SQL Editor do Supabase:\n');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    process.exit(1);
  }
  
  console.log('✅ Migration aplicada com sucesso!');
  
  // Testar a função com UUID
  console.log('\n🧪 Testando função com UUID...');
  const testResult = await supabase.rpc('get_public_property_detail_with_realtor', {
    broker_slug: 'danierick',
    property_slug: '651438be-46db-4347-a3b4-508820abc1a0'
  });
  
  if (testResult.error) {
    console.error('❌ Erro no teste:', testResult.error);
  } else if (!testResult.data || testResult.data.length === 0) {
    console.log('⚠️  Nenhum resultado retornado (verifique se o imóvel existe e está ativo)');
  } else {
    console.log('✅ Teste com UUID passou!');
    console.log('   Imóvel encontrado:', testResult.data[0].title);
    console.log('   Slug:', testResult.data[0].slug);
  }
  
  process.exit(0);
})();
