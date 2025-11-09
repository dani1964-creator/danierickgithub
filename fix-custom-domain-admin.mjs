import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://demcjskpwcxqohzlyjxb.supabase.co';
// Usando SERVICE ROLE KEY para ter permissões completas
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.J1yZyglh0SN_fqOlOFy-YrWBF0IrQDl0p4y3_AwPkpI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const brokerId = '1e7b21c7-1727-4741-8b89-dcddc406ce06';

console.log('🔧 Removendo test-domain.local (usando SERVICE ROLE)...\n');

// Verificar valor atual
const { data: before } = await supabase
  .from('brokers')
  .select('id, website_slug, custom_domain')
  .eq('id', brokerId)
  .single();

console.log('Antes:', before);

// Atualizar
const { data, error } = await supabase
  .from('brokers')
  .update({ custom_domain: null })
  .eq('id', brokerId)
  .select()
  .single();

if (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

console.log('\nDepois:', data);
console.log('\n✅ Atualizado com sucesso!');
