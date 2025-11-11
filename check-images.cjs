const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkImages() {
  console.log('🔍 Verificando URLs de imagens das propriedades...\n');
  
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, title, slug, main_image_url, images')
    .eq('is_active', true)
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar propriedades:', error);
    return;
  }

  properties.forEach((prop, idx) => {
    console.log(`\n${idx + 1}. ${prop.title} (${prop.slug})`);
    console.log(`   Main image: ${prop.main_image_url || 'NENHUMA'}`);
    console.log(`   Images array: ${prop.images?.length || 0} imagens`);
    
    if (prop.images && prop.images.length > 0) {
      prop.images.forEach((img, i) => {
        console.log(`   [${i}] ${img}`);
      });
    }
  });
}

checkImages().catch(console.error);
