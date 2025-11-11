#!/usr/bin/env node

/**
 * Script para gerar slugs para imóveis que não possuem
 * Executa a migration SQL no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('   Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generatePropertySlugs() {
  console.log('🔄 Iniciando geração de slugs para imóveis...\n');

  try {
    // 1. Buscar imóveis sem slug
    const { data: propertiesWithoutSlug, error: fetchError } = await supabase
      .from('properties')
      .select('id, title, slug')
      .or('slug.is.null,slug.eq.');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📊 Encontrados ${propertiesWithoutSlug?.length || 0} imóveis sem slug\n`);

    if (!propertiesWithoutSlug || propertiesWithoutSlug.length === 0) {
      console.log('✅ Todos os imóveis já possuem slugs!');
      return;
    }

    // 2. Gerar e atualizar slugs
    let updated = 0;
    let errors = 0;

    for (const property of propertiesWithoutSlug) {
      try {
        // Gera slug usando a mesma lógica do trigger SQL
        const slug = generateSlug(property.title) + '-' + property.id.substring(0, 8);
        
        const { error: updateError } = await supabase
          .from('properties')
          .update({ slug })
          .eq('id', property.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${property.id}:`, updateError.message);
          errors++;
        } else {
          console.log(`✅ ${property.title} → ${slug}`);
          updated++;
        }
      } catch (err) {
        console.error(`❌ Erro ao processar ${property.id}:`, err.message);
        errors++;
      }
    }

    console.log('\n📈 Resumo:');
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   📊 Total: ${propertiesWithoutSlug.length}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

/**
 * Replica a lógica da função generate_slug() do PostgreSQL
 */
function generateSlug(title) {
  let slug = title.toLowerCase();
  
  // Substituir caracteres acentuados
  const accents = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c', 'ñ': 'n'
  };
  
  for (const [accent, replacement] of Object.entries(accents)) {
    slug = slug.replace(new RegExp(accent, 'g'), replacement);
  }
  
  // Remover caracteres especiais, manter apenas letras, números e espaços
  slug = slug.replace(/[^a-z0-9\s\-]/g, '');
  
  // Substituir espaços por hífens
  slug = slug.replace(/\s+/g, '-');
  
  // Remover hífens duplicados
  slug = slug.replace(/-+/g, '-');
  
  // Remover hífens do início e fim
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
}

// Executar script
generatePropertySlugs()
  .then(() => {
    console.log('\n✨ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
