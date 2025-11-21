#!/usr/bin/env node

/**
 * TESTE FINAL APÓS CORREÇÃO
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testeFinal() {
  console.log('🧪 TESTE FINAL - AGUARDANDO EXECUÇÃO DO SQL...\n');
  
  const brokerId = "1e7b21c7-1727-4741-8b89-dcddc406ce06";

  // Teste múltiplo para verificar se ainda está intermitente
  console.log('🎯 TESTANDO 5 VEZES...\n');

  for (let i = 1; i <= 5; i++) {
    try {
      const start = Date.now();
      const { data, error } = await publicSupabase
        .rpc('get_homepage_categories_with_properties', {
          p_broker_id: brokerId,
          p_properties_per_category: 12
        });
      const tempo = Date.now() - start;

      if (error) {
        console.log(`❌ Tentativa ${i}: ERRO - ${error.message} (${tempo}ms)`);
      } else {
        const categorias = data?.length || 0;
        const totalImoveis = data?.reduce((total, cat) => {
          return total + (cat.properties_count || (cat.properties ? cat.properties.length : 0));
        }, 0) || 0;
        
        console.log(`✅ Tentativa ${i}: ${categorias} categorias, ${totalImoveis} imóveis (${tempo}ms)`);
        
        if (totalImoveis > 0) {
          console.log('   🎉 IMÓVEIS APARECENDO!');
        }
      }
    } catch (err) {
      console.log(`💥 Tentativa ${i}: EXCEÇÃO - ${err.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

testeFinal().catch(console.error);