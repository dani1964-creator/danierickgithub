#!/usr/bin/env node

// Use require instead of import to avoid module issues
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww';

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const request = (isHttps ? https : http).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    request.on('error', reject);
    
    if (options.body) {
      request.write(options.body);
    }
    
    request.end();
  });
}

async function createDanierickBroker() {
  try {
    console.log('🚀 Criando broker "danierick"...');
    
    // Primeiro, verificar se já existe
    console.log('🔍 Verificando se broker já existe...');
    const existingBrokers = await makeRequest(`${SUPABASE_URL}/rest/v1/brokers?website_slug=eq.danierick&select=id,business_name,website_slug`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    console.log('Brokers existentes com slug "danierick":', existingBrokers);
    
    if (existingBrokers && existingBrokers.length > 0) {
      console.log('✅ Broker "danierick" já existe!');
      return existingBrokers[0];
    }
    
    // Se não existe, criar
    console.log('📝 Criando novo broker...');
    
    const brokerData = {
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      business_name: 'Danierick Imobiliária',
      website_slug: 'danierick',
      email: 'danierick@adminimobiliaria.site',
      phone: '(11) 99999-7777',
      address: 'Av. Principal, 1000 - Sala 101',
      city: 'São Paulo',
      uf: 'SP',
      cep: '01310-100',
      primary_color: '#1e40af',
      secondary_color: '#64748b',
      is_active: true,
      subscription_status: 'active',
      subscription_tier: 'pro',
      site_title: 'Danierick Imobiliária - Seu Imóvel Ideal',
      site_description: 'Encontre o imóvel perfeito com a Danierick Imobiliária. Especialistas em vendas e locações em São Paulo.',
      subdomain: 'danierick',
      canonical_prefer_custom_domain: false
    };
    
    const result = await makeRequest(`${SUPABASE_URL}/rest/v1/brokers`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(brokerData)
    });
    
    console.log('✅ Broker criado:', result);
    
    // Agora, criar algumas propriedades de exemplo
    console.log('🏠 Criando propriedades de exemplo...');
    
    // Verificar se as propriedades já existem
    const existingProperties = await makeRequest(`${SUPABASE_URL}/rest/v1/properties?property_code=in.(DAN001,DAN002,DAN003)&select=id,title,property_code`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    console.log('Propriedades existentes:', existingProperties);
    
    if (!existingProperties || existingProperties.length === 0) {
      // Criar propriedades
      const properties = [
        {
          broker_id: result.id || result[0]?.id,
          title: 'Casa Moderna Vila Madalena',
          description: 'Linda casa reformada na Vila Madalena, com acabamentos de primeira qualidade.',
          price: 850000,
          property_type: 'Casa',
          transaction_type: 'Venda',
          address: 'Rua Harmonia, 445',
          neighborhood: 'Vila Madalena',
          city: 'São Paulo',
          uf: 'SP',
          bedrooms: 3,
          bathrooms: 2,
          area_m2: 120,
          parking_spaces: 2,
          is_featured: true,
          is_active: true,
          main_image_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          features: ['Churrasqueira', 'Quintal', 'Próximo ao metrô'],
          status: 'available',
          slug: 'casa-moderna-vila-madalena',
          property_code: 'DAN001'
        },
        {
          broker_id: result.id || result[0]?.id,
          title: 'Apartamento Centro Histórico',
          description: 'Apartamento completamente renovado no coração da cidade.',
          price: 520000,
          property_type: 'Apartamento',
          transaction_type: 'Venda',
          address: 'Rua São Bento, 123, Apto 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          uf: 'SP',
          bedrooms: 2,
          bathrooms: 1,
          area_m2: 65,
          parking_spaces: 0,
          is_featured: true,
          is_active: true,
          main_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          features: ['Vista panorâmica', 'Reformado', 'Localização privilegiada'],
          status: 'available',
          slug: 'apartamento-centro-historico',
          property_code: 'DAN002'
        }
      ];
      
      for (const property of properties) {
        try {
          const propertyResult = await makeRequest(`${SUPABASE_URL}/rest/v1/properties`, {
            method: 'POST',
            headers: {
              'apikey': ANON_KEY,
              'Authorization': `Bearer ${ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(property)
          });
          
          console.log(`✅ Propriedade criada: ${property.title}`);
        } catch (propError) {
          console.error(`❌ Erro ao criar propriedade ${property.title}:`, propError);
        }
      }
    } else {
      console.log('✅ Propriedades já existem!');
    }
    
    // Verificar resultado final
    console.log('\n🔍 Verificação final...');
    const finalCheck = await makeRequest(`${SUPABASE_URL}/rest/v1/brokers?website_slug=eq.danierick&select=*`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    console.log('✅ Broker final:', finalCheck);
    
    console.log('\n🎉 Setup completo!');
    console.log('\n📍 URLs para testar:');
    console.log('   • https://adminimobiliaria.site/danierick');
    console.log('   • https://danierick.adminimobiliaria.site');
    console.log('   • http://localhost:5173/danierick (dev)');
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createDanierickBroker();