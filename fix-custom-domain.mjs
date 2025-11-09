import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww';

const supabase = createClient(supabaseUrl, supabaseKey);

const brokerId = '1e7b21c7-1727-4741-8b89-dcddc406ce06';

console.log('🔧 Removendo test-domain.local do broker danierick...\n');

const { data, error } = await supabase
  .from('brokers')
  .update({ custom_domain: null })
  .eq('id', brokerId)
  .select();

if (error) {
  console.error('❌ Erro ao atualizar:', error);
  process.exit(1);
}

console.log('✅ Custom domain removido com sucesso!');
console.log('\nBroker atualizado:');
console.log(data);

console.log('\n✨ Agora o botão "Ver Site Público" deve abrir: https://danierick.adminimobiliaria.site');
