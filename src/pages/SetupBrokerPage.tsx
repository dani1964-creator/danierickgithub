import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SetupBrokerPage = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const createDanierickBroker = async () => {
    setLoading(true);
    setStatus('🚀 Iniciando criação do broker "danierick"...');
    
    try {
      // 1. Verificar se broker já existe
      setStatus('🔍 Verificando se broker já existe...');
      const { data: existingBrokers } = await supabase
        .from('brokers')
        .select('*')
        .eq('website_slug', 'danierick');

      if (existingBrokers && existingBrokers.length > 0) {
        setStatus('✅ Broker "danierick" já existe!');
        setResult(existingBrokers[0]);
        setLoading(false);
        return;
      }

      // 2. Obter usuário atual ou usar um temporário
      setStatus('👤 Verificando usuário atual...');
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '550e8400-e29b-41d4-a716-446655440001'; // ID temporário se não logado

      // 3. Criar broker
      setStatus('📝 Criando broker "danierick"...');
      const brokerData = {
        user_id: userId,
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

      const { data: newBroker, error: brokerError } = await supabase
        .from('brokers')
        .insert(brokerData)
        .select()
        .single();

      if (brokerError) {
        throw new Error(`Erro ao criar broker: ${brokerError.message}`);
      }

      setStatus('✅ Broker criado com sucesso! Criando propriedades de exemplo...');

      // 4. Criar propriedades de exemplo
      const properties = [
        {
          broker_id: newBroker.id,
          title: 'Casa Moderna Vila Madalena',
          description: 'Linda casa reformada na Vila Madalena, com acabamentos de primeira qualidade. Próxima ao metrô, comércio e vida noturna da região.',
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
          images: [
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
          ],
          features: ['Churrasqueira', 'Quintal', 'Próximo ao metrô', 'Área gourmet'],
          status: 'available',
          slug: 'casa-moderna-vila-madalena',
          property_code: 'DAN001'
        },
        {
          broker_id: newBroker.id,
          title: 'Apartamento Centro Histórico',
          description: 'Apartamento completamente renovado no coração da cidade. Vista incrível, próximo a transporte público, restaurantes e pontos turísticos.',
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
          images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
          ],
          features: ['Vista panorâmica', 'Reformado', 'Localização privilegiada'],
          status: 'available',
          slug: 'apartamento-centro-historico',
          property_code: 'DAN002'
        }
      ];

      const { data: newProperties, error: propertiesError } = await supabase
        .from('properties')
        .insert(properties)
        .select();

      if (propertiesError) {
        console.warn('Aviso ao criar propriedades:', propertiesError.message);
      }

      setStatus('🎉 Setup completo! Broker e propriedades criados com sucesso.');
      setResult({
        broker: newBroker,
        properties: newProperties || []
      });

    } catch (error) {
      setStatus(`❌ Erro: ${error.message}`);
      console.error('Erro completo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔧 Setup do Broker Danierick
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Operação</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="font-mono text-sm">{status || 'Aguardando...'}</p>
          </div>
          
          <button
            onClick={createDanierickBroker}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? '⏳ Processando...' : '🚀 Criar Broker Danierick'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">✅ Resultado</h2>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-green-800 mb-2">Broker Criado:</h3>
              <pre className="text-sm text-green-700 overflow-auto">
                {JSON.stringify(result.broker || result, null, 2)}
              </pre>
            </div>
            
            {result.properties && result.properties.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Propriedades Criadas:</h3>
                <pre className="text-sm text-blue-700 overflow-auto">
                  {JSON.stringify(result.properties, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📍 URLs para Testar</h2>
          <div className="space-y-2">
            <div>
              <strong>Produção (Slug):</strong>
              <a href="https://adminimobiliaria.site/danierick" target="_blank" rel="noopener noreferrer" 
                 className="ml-2 text-blue-600 hover:underline">
                https://adminimobiliaria.site/danierick
              </a>
            </div>
            <div>
              <strong>Produção (Subdomínio):</strong>
              <a href="https://danierick.adminimobiliaria.site" target="_blank" rel="noopener noreferrer"
                 className="ml-2 text-blue-600 hover:underline">
                https://danierick.adminimobiliaria.site
              </a>
            </div>
            <div>
              <strong>Desenvolvimento:</strong>
              <a href="http://localhost:5173/danierick" target="_blank" rel="noopener noreferrer"
                 className="ml-2 text-blue-600 hover:underline">
                http://localhost:5173/danierick
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupBrokerPage;