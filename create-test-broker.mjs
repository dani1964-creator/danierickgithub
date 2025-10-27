import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestBroker() {
  try {
    console.log('🚀 Criando broker de teste...');
    
    // 1. Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'teste@imobiliaria.com',
      password: '123456789',
      options: {
        data: {
          nome: 'Admin Teste',
          email: 'teste@imobiliaria.com'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message);
      return;
    }
    
    console.log('✅ Usuário criado:', authData.user?.email);
    
    // 2. Fazer login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste@imobiliaria.com',
      password: '123456789'
    });
    
    if (loginError) {
      console.error('❌ Erro ao fazer login:', loginError.message);
      return;
    }
    
    console.log('✅ Login realizado:', loginData.user?.email);
    
    // 3. Criar broker
    const brokerData = {
      user_id: loginData.user.id,
      business_name: 'Imobiliária Teste',
      website_slug: 'imobiliaria-teste',
      email: 'teste@imobiliaria.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      uf: 'SP',
      cep: '01234-567',
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      is_active: true,
      subscription_status: 'active',
      subscription_tier: 'pro',
      site_title: 'Imobiliária Teste - Os Melhores Imóveis',
      site_description: 'Encontre o imóvel dos seus sonhos com a Imobiliária Teste'
    };
    
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .insert(brokerData)
      .select()
      .single();
    
    if (brokerError) {
      console.error('❌ Erro ao criar broker:', brokerError.message);
      return;
    }
    
    console.log('✅ Broker criado:', broker.business_name, '- ID:', broker.id);
    
    // 4. Criar propriedades de teste
    const properties = [
      {
        broker_id: broker.id,
        title: 'Apartamento Moderno Centro',
        description: 'Lindo apartamento no centro da cidade, totalmente reformado com acabamentos de primeira qualidade.',
        price: 450000,
        property_type: 'Apartamento',
        transaction_type: 'Venda',
        address: 'Rua Central, 456',
        neighborhood: 'Centro',
        city: 'São Paulo',
        uf: 'SP',
        bedrooms: 3,
        bathrooms: 2,
        area_m2: 85,
        parking_spaces: 1,
        is_featured: true,
        is_active: true,
        main_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        ],
        features: ['Varanda', 'Churrasqueira', 'Piscina'],
        status: 'available',
        slug: 'apartamento-moderno-centro'
      },
      {
        broker_id: broker.id,
        title: 'Casa Familiar Jardins',
        description: 'Ampla casa familiar em condomínio fechado, com área de lazer completa e segurança 24h.',
        price: 750000,
        property_type: 'Casa',
        transaction_type: 'Venda',
        address: 'Rua das Palmeiras, 789',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        uf: 'SP',
        bedrooms: 4,
        bathrooms: 3,
        area_m2: 150,
        parking_spaces: 2,
        is_featured: true,
        is_active: true,
        main_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        images: [
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        ],
        features: ['Área de lazer', 'Piscina', 'Academia', 'Segurança 24h'],
        status: 'available',
        slug: 'casa-familiar-jardins'
      }
    ];
    
    const { data: createdProperties, error: propsError } = await supabase
      .from('properties')
      .insert(properties)
      .select();
    
    if (propsError) {
      console.warn('⚠️ Erro ao criar propriedades:', propsError.message);
    } else {
      console.log('✅ Propriedades criadas:', createdProperties?.length);
    }
    
    console.log('\n🎉 Broker de teste criado com sucesso!');
    console.log('📊 Resumo:');
    console.log('- ID:', broker.id);
    console.log('- Nome:', broker.business_name);
    console.log('- Slug:', broker.website_slug);
    console.log('- Email:', broker.email);
    console.log('\n🌐 URLs para teste:');
    console.log('- Local:', `http://localhost:3001/${broker.website_slug}`);
    console.log('- Produção:', `https://adminimobiliaria-8cx7x.ondigitalocean.app/${broker.website_slug}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestBroker();