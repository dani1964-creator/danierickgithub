const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.join(__dirname, 'frontend', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBackgroundImageUrl() {
  console.log('🔧 Corrigindo URL da imagem de fundo...\n');
  
  const brokerId = '1e7b21c7-1727-4741-8b89-dcddc406ce06';
  
  // URL antiga (com parâmetros temporários)
  const oldUrl = 'https://img.freepik.com/fotos-gratis/familia-jovem-com-seus-filhos-em-casa-se-divertindo_1303-20999.jpg?t=st=1755301589~exp=1755305189~hmac=d11419e64c59c88943a86a9144969edb49912529fefd751e557ff5e370ba20a4&w=1480';
  
  // URL nova (sem parâmetros - permanente)
  const newUrl = 'https://img.freepik.com/fotos-gratis/familia-jovem-com-seus-filhos-em-casa-se-divertindo_1303-20999.jpg';
  
  console.log('📋 Atualizando URL:');
  console.log(`   De: ${oldUrl.substring(0, 80)}...`);
  console.log(`   Para: ${newUrl}\n`);
  
  const { data, error } = await supabase
    .from('brokers')
    .update({ background_image_url: newUrl })
    .eq('id', brokerId)
    .select();
  
  if (error) {
    console.error('❌ Erro ao atualizar:', error);
    return;
  }
  
  console.log('✅ URL da imagem de fundo atualizada com sucesso!');
  console.log(`   Broker: ${data[0].business_name}`);
  console.log(`   Nova URL: ${data[0].background_image_url}\n`);
  
  // Testar se a nova URL está acessível
  console.log('🌐 Testando acessibilidade da nova URL...');
  try {
    const response = await fetch(newUrl, { method: 'HEAD' });
    console.log(`   Status HTTP: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    if (response.status === 200) {
      console.log('   ✅ Imagem acessível!\n');
    } else {
      console.log('   ⚠️ Status inesperado\n');
    }
  } catch (fetchError) {
    console.error(`   ❌ Erro ao acessar: ${fetchError.message}\n`);
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ CONCLUÍDO! A imagem de fundo agora usa URL permanente.');
  console.log('   Não haverá mais problemas com tokens expirados.');
  console.log('═══════════════════════════════════════════════════════════');
}

fixBackgroundImageUrl().catch(console.error);
