#!/usr/bin/env node

/**
 * VERIFICAÇÃO ESPECÍFICA DA ESTRUTURA DA TABELA PROPERTIES
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://demcjskpwcxqohzlyjxb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM";

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verificarEstrutura() {
  console.log('🔍 VERIFICAÇÃO ESPECÍFICA: ESTRUTURA TABELA PROPERTIES\n');
  console.log('=' .repeat(60));

  // 1. Buscar um registro da tabela properties para ver suas colunas
  console.log('📋 VERIFICANDO COLUNAS DA TABELA PROPERTIES...\n');

  try {
    const { data: properties, error } = await adminSupabase
      .from('properties')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Erro ao acessar properties: ${error.message}`);
    } else if (properties && properties.length > 0) {
      const colunas = Object.keys(properties[0]);
      console.log('✅ Colunas encontradas na tabela PROPERTIES:');
      colunas.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });

      console.log('\n🔍 VERIFICANDO COLUNAS ESPECÍFICAS...\n');

      const colunasEsperadas = [
        'location',
        'created_at', 
        'title',
        'slug',
        'price',
        'property_type',
        'transaction_type',
        'bedrooms',
        'bathrooms',
        'area',
        'is_featured',
        'is_active',
        'is_published',
        'images'
      ];

      const colunasFaltando = [];
      
      colunasEsperadas.forEach(colEsperada => {
        if (colunas.includes(colEsperada)) {
          console.log(`   ✅ ${colEsperada}`);
        } else {
          console.log(`   ❌ ${colEsperada} - FALTANDO!`);
          colunasFaltando.push(colEsperada);
        }
      });

      if (colunasFaltando.length > 0) {
        console.log('\n🚨 COLUNAS FALTANDO:');
        colunasFaltando.forEach(col => {
          console.log(`   ❌ ${col}`);
        });

        console.log('\n📝 SQL PARA ADICIONAR COLUNAS FALTANDO:\n');
        
        const sqlAlters = [];
        
        colunasFaltando.forEach(col => {
          switch(col) {
            case 'location':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN location TEXT;');
              break;
            case 'property_type':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN property_type TEXT;');
              break;
            case 'transaction_type':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN transaction_type TEXT DEFAULT \'venda\';');
              break;
            case 'bedrooms':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN bedrooms INTEGER;');
              break;
            case 'bathrooms':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN bathrooms INTEGER;');
              break;
            case 'area':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN area DECIMAL(10,2);');
              break;
            case 'is_featured':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN is_featured BOOLEAN DEFAULT false;');
              break;
            case 'images':
              sqlAlters.push('ALTER TABLE properties ADD COLUMN images JSONB DEFAULT \'[]\'::jsonb;');
              break;
            default:
              sqlAlters.push(`ALTER TABLE properties ADD COLUMN ${col} TEXT;`);
          }
        });

        sqlAlters.forEach(sql => {
          console.log(sql);
        });

        console.log('\n' + '=' .repeat(60));

      } else {
        console.log('\n✅ TODAS AS COLUNAS NECESSÁRIAS EXISTEM!');
      }

    } else {
      console.log('❌ Nenhum registro encontrado na tabela properties');
    }

  } catch (err) {
    console.log(`💥 Erro ao verificar estrutura: ${err.message}`);
  }

  // 2. Testar query específica que estava falhando
  console.log('\n🧪 TESTANDO QUERY ESPECÍFICA QUE FALHAVA...\n');

  try {
    const { data: testData, error: testError } = await adminSupabase
      .from('property_category_assignments')
      .select(`
        *,
        properties (id, title, slug, price, is_active, is_published)
      `)
      .eq('broker_id', '1e7b21c7-1727-4741-8b89-dcddc406ce06')
      .limit(1);

    if (testError) {
      console.log(`❌ Query teste falhou: ${testError.message}`);
    } else {
      console.log('✅ Query básica funcionou');
      
      // Testar com location
      try {
        const { data: locationTest, error: locationError } = await adminSupabase
          .from('properties')
          .select('id, title, location')
          .limit(1);

        if (locationError) {
          console.log(`❌ Coluna 'location' não existe: ${locationError.message}`);
        } else {
          console.log('✅ Coluna \'location\' existe');
        }
      } catch (err) {
        console.log(`❌ Erro ao testar coluna location: ${err.message}`);
      }
    }

  } catch (err) {
    console.log(`💥 Erro no teste de query: ${err.message}`);
  }

  // 3. Verificar se precisa atualizar a RPC
  console.log('\n⚙️ VERIFICANDO SE RPC PRECISA SER ATUALIZADA...\n');

  if (colunasFaltando && colunasFaltando.length > 0) {
    console.log('🔄 A função RPC precisa ser atualizada para remover colunas que não existem');
    
    console.log('\n📝 FUNÇÃO RPC CORRIGIDA (sem colunas inexistentes):\n');

    // Buscar colunas existentes
    const { data: sampleProp } = await adminSupabase
      .from('properties')
      .select('*')
      .limit(1);

    if (sampleProp && sampleProp.length > 0) {
      const colunasReais = Object.keys(sampleProp[0]);
      const colunasParaRPC = colunasReais.filter(col => 
        ['id', 'title', 'slug', 'price', 'is_featured', 'created_at', 'is_active', 'is_published'].includes(col) ||
        col.includes('bedroom') || col.includes('bathroom') || col.includes('area') || 
        col.includes('location') || col.includes('type') || col.includes('image')
      );

      console.log('🔧 Colunas seguras para usar na RPC:');
      colunasParaRPC.forEach(col => {
        console.log(`   - ${col}`);
      });
    }
  }
}

verificarEstrutura().catch(console.error);