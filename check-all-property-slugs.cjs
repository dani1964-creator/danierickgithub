const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Verificando imóveis sem slug...\n');
  
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, slug, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total de imóveis recentes: ${data.length}\n`);
  
  let withoutSlug = 0;
  data.forEach((prop, idx) => {
    const hasSlug = !!prop.slug;
    if (!hasSlug) withoutSlug++;
    
    console.log(`${idx + 1}. ${prop.title}`);
    console.log(`   ID: ${prop.id}`);
    console.log(`   Slug: ${prop.slug || '❌ SEM SLUG'}`);
    console.log(`   Created: ${prop.created_at}`);
    console.log('');
  });
  
  console.log(`\n📊 Resumo: ${withoutSlug} imóveis sem slug de ${data.length} verificados`);
  process.exit(0);
})();
