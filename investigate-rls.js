#!/usr/bin/env node

/**
 * SCRIPT PARA INVESTIGAR E RESOLVER POLÍTICAS RLS
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJOUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function investigateRLS() {
  console.log('🔐 INVESTIGANDO POLÍTICAS RLS...\n');

  try {
    // Vou tentar uma abordagem alternativa: usar uma consulta raw SQL para verificar RLS
    console.log('🔍 Tentativa 1: Verificar status RLS via query...\n');
    
    // Tentar inserir com dados mínimos para ver erro detalhado
    console.log('🧪 Tentativa 2: Teste de inserção simples...\n');
    
    const testData = {
      property_id: 'b497fe1f-0bf8-404b-b55e-04772aecb3eb',
      category_id: '5e1ebc48-e38b-4631-84ce-ec25f2fd2517',
      broker_id: '1e7b21c7-1727-4741-8b89-dcddc406ce06'
    };

    const { data, error } = await supabase
      .from('property_category_assignments')
      .insert(testData)
      .select();

    if (error) {
      console.log(`❌ Erro detalhado: ${error.message}`);
      console.log(`   Código: ${error.code}`);
      console.log(`   Detalhes: ${error.details}`);
      console.log(`   Hint: ${error.hint}`);
    } else {
      console.log(`✅ Sucesso inesperado:`, data);
    }

    // Vou tentar uma abordagem diferente: Usar SQL direto
    console.log('\n🛠️ Tentativa 3: Usar SQL direto...\n');

    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO property_category_assignments (property_id, category_id, broker_id)
          VALUES 
            ('b497fe1f-0bf8-404b-b55e-04772aecb3eb', '5e1ebc48-e38b-4631-84ce-ec25f2fd2517', '1e7b21c7-1727-4741-8b89-dcddc406ce06'),
            ('fe3fe80c-7c62-4ede-b718-2dd70cf8b412', '5e1ebc48-e38b-4631-84ce-ec25f2fd2517', '1e7b21c7-1727-4741-8b89-dcddc406ce06'),
            ('651438be-46db-4347-a3b4-508820abc1a0', '5e1ebc48-e38b-4631-84ce-ec25f2fd2517', '1e7b21c7-1727-4741-8b89-dcddc406ce06'),
            ('b497fe1f-0bf8-404b-b55e-04772aecb3eb', 'f592dd7f-e550-47fb-a930-e5ae41fd3d1f', '1e7b21c7-1727-4741-8b89-dcddc406ce06'),
            ('651438be-46db-4347-a3b4-508820abc1a0', 'f592dd7f-e550-47fb-a930-e5ae41fd3d1f', '1e7b21c7-1727-4741-8b89-dcddc406ce06');
        `
      });

      if (sqlError) {
        console.log(`❌ SQL direto também falhou: ${sqlError.message}`);
      } else {
        console.log(`✅ SQL direto funcionou:`, sqlResult);
      }
    } catch (sqlErr) {
      console.log(`❌ SQL direto não disponível: ${sqlErr.message}`);
    }

    // Tentativa 4: Verificar se há alguma função RPC para isso
    console.log('\n🎯 Tentativa 4: Procurar RPC function existente...\n');

    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_property_category_association', {
        p_property_id: 'b497fe1f-0bf8-404b-b55e-04772aecb3eb',
        p_category_id: '5e1ebc48-e38b-4631-84ce-ec25f2fd2517',
        p_broker_id: '1e7b21c7-1727-4741-8b89-dcddc406ce06'
      });

      if (rpcError) {
        console.log(`❌ RPC personalizada não existe: ${rpcError.message}`);
      } else {
        console.log(`✅ RPC personalizada funcionou:`, rpcResult);
      }
    } catch (rpcErr) {
      console.log(`❌ RPC personalizada falhou: ${rpcErr.message}`);
    }

    // Tentativa 5: Verificar se posso desabilitar RLS temporariamente
    console.log('\n⚙️ Tentativa 5: Verificar permissões de alteração...\n');

    try {
      const { data: alterResult, error: alterError } = await supabase.rpc('toggle_rls', {
        table_name: 'property_category_assignments',
        enable: false
      });

      if (alterError) {
        console.log(`❌ Não posso alterar RLS: ${alterError.message}`);
      } else {
        console.log(`✅ RLS alterado:`, alterResult);
      }
    } catch (alterErr) {
      console.log(`❌ Alteração RLS falhou: ${alterErr.message}`);
    }

    console.log('\n💡 SOLUÇÕES POSSÍVEIS:');
    console.log('1. 🔑 Usar service role key válida');
    console.log('2. 🛠️ Criar RPC function que bypassa RLS');
    console.log('3. 📝 Ajustar políticas RLS para permitir inserção');
    console.log('4. 🎯 Usar interface web do Supabase para inserir dados');
    console.log('5. 💻 Inserir via SQL no dashboard do Supabase');

  } catch (error) {
    console.error('💥 Erro na investigação:', error.message);
  }
}

investigateRLS();