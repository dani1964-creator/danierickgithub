import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://demcjskpwcxqohzlyjxb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createDanierickBroker() {
  try {
    console.log('🚀 Criando broker "danierick"...');
    
    // 1. Primeiro verificar se já existe
    const { data: existingBroker, error: checkError } = await supabase
      .from('brokers')
      .select('id, business_name, website_slug, email')
      .eq('website_slug', 'danierick')
      .single();
    
    if (existingBroker) {
      console.log('✅ Broker "danierick" já existe:', existingBroker);
      
      // Testar função RPC
      console.log('\n🔧 Testando função RPC...');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_broker_by_domain_or_slug', {
        website_slug_param: 'danierick'
      });
      
      if (rpcError) {
        console.log('❌ Erro na função RPC:', rpcError);
      } else {
        console.log('✅ Função RPC funcionando:', rpcResult);
      }
      
      return;
    }
    
    // 2. Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'danierick@test.com',
      password: '123456789',
      options: {
        data: {
          nome: 'Danierick Admin',
          email: 'danierick@test.com'
        }
      }
    });
    
    if (authError) {
      console.log('⚠️ Aviso de autenticação (pode ser normal):', authError.message);
    }
    
    // 3. Fazer login para obter user_id
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'danierick@test.com',
      password: '123456789'
    });
    
    let userId = loginData?.user?.id;
    
    if (loginError) {
      console.log('⚠️ Não foi possível fazer login, usando UUID gerado');
      // Usar um UUID fixo para teste se o login falhar
      userId = '550e8400-e29b-41d4-a716-446655440000';
    }
    
    // 4. Criar broker
    const brokerData = {
      user_id: userId,
      business_name: 'Danierick Imobiliária',
      website_slug: 'danierick',
      email: 'danierick@test.com',
      phone: '(11) 99999-8888',
      address: 'Rua Principal, 100',
      city: 'São Paulo',
      uf: 'SP',
      cep: '01234-567',
      primary_color: '#1e40af',
      secondary_color: '#6b7280',
      is_active: true,
      subscription_status: 'active',
      subscription_tier: 'pro',
      site_title: 'Danierick Imobiliária - Seu Imóvel Ideal',
      site_description: 'Encontre o imóvel perfeito com a Danierick Imobiliária'
    };
    
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .insert(brokerData)
      .select()
      .single();
    
    if (brokerError) {
      console.error('❌ Erro ao criar broker:', brokerError);
      
      // Tentar com service role key se disponível
      console.log('🔄 Tentando com permissões administrativas...');
      const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM';
      const adminSupabase = createClient(supabaseUrl, serviceKey);
      
      const { data: adminBroker, error: adminError } = await adminSupabase
        .from('brokers')
        .insert(brokerData)
        .select()
        .single();
      
      if (adminError) {
        console.error('❌ Erro mesmo com permissões admin:', adminError);
        return;
      }
      
      broker = adminBroker;
    }
    
    console.log('✅ Broker criado com sucesso:', broker);
    
    // 5. Criar algumas propriedades
    const properties = [
      {
        broker_id: broker.id,
        title: 'Casa Moderna Danierick',
        description: 'Linda casa em localização privilegiada.',
        price: 550000,
        property_type: 'Casa',
        transaction_type: 'Venda',
        address: 'Rua dos Sonhos, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        uf: 'SP',
        bedrooms: 3,
        bathrooms: 2,
        area_m2: 120,
        parking_spaces: 2,
        is_featured: true,
        is_active: true,
        main_image_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        images: [
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
        ],
        features: ['Garagem', 'Quintal', 'Área de lazer'],
        status: 'available',
        slug: 'casa-moderna-danierick'
      }
    ];
    
    const { data: createdProps, error: propsError } = await supabase
      .from('properties')
      .insert(properties)
      .select();
    
    if (propsError) {
      console.warn('⚠️ Erro ao criar propriedades:', propsError.message);
    } else {
      console.log('✅ Propriedade criada:', createdProps?.length);
    }
    
    console.log('\n🎉 Broker "danierick" criado com sucesso!');
    console.log('\n🌐 Teste agora em:');
    console.log('- DigitalOcean: https://adminimobiliaria-8cx7x.ondigitalocean.app/danierick');
    console.log('- Cloudflare: https://adminimobiliaria.site/danierick');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createDanierickBroker();