const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww";

async function listarBrokers() {
  console.log('📋 LISTANDO TODOS OS BROKERS\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data: brokers, error } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, custom_domain, display_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log(`✅ ${brokers.length} brokers encontrados:`);
    brokers.forEach((broker, index) => {
      console.log(`\n${index + 1}. ${broker.business_name}`);
      console.log(`   ID: ${broker.id}`);
      console.log(`   Slug: ${broker.website_slug}`);
      console.log(`   Display Name: ${broker.display_name || 'N/A'}`);
      console.log(`   Domínio customizado: ${broker.custom_domain || 'Nenhum'}`);
      console.log(`   URL: https://${broker.website_slug}.adminimobiliaria.site`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

listarBrokers();