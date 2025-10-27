import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDomainAware } from '@/hooks/useDomainAware';
import { useParams } from 'react-router-dom';

interface DebugInfo {
  slug?: string;
  isCustomDomain: boolean;
  currentUrl: string;
  timestamp: string;
  allBrokers?: any[];
  brokersError?: any;
  rpcResult?: any;
  rpcError?: any;
  rpcException?: string;
  brokerFromHook?: any;
  hookException?: string;
  specificBroker?: any;
  specificError?: any;
}

const DebugPage = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    isCustomDomain: false,
    currentUrl: '',
    timestamp: ''
  });
  const [loading, setLoading] = useState(true);
  const { slug } = useParams();
  const { getBrokerByDomainOrSlug, isCustomDomain } = useDomainAware();

  useEffect(() => {
    const debugBroker = async () => {
      try {
        const info: DebugInfo = {
          slug,
          isCustomDomain: isCustomDomain(),
          currentUrl: window.location.href,
          timestamp: new Date().toISOString()
        };

        // 1. Listar todos os brokers
        const { data: allBrokers, error: brokersError } = await supabase
          .from('brokers')
          .select('id, business_name, website_slug, email, is_active')
          .limit(10);

        info.allBrokers = allBrokers || [];
        info.brokersError = brokersError;

        // 2. Testar função RPC
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('get_broker_by_domain_or_slug', {
            slug_name: slug
          });
          info.rpcResult = rpcResult;
          info.rpcError = rpcError;
        } catch (rpcException) {
          info.rpcException = rpcException.message;
        }

        // 3. Testar hook domain-aware
        try {
          const brokerFromHook = await getBrokerByDomainOrSlug(slug);
          info.brokerFromHook = brokerFromHook;
        } catch (hookException) {
          info.hookException = hookException.message;
        }

        // 4. Verificar se broker específico existe
        if (slug) {
          const { data: specificBroker, error: specificError } = await supabase
            .from('brokers')
            .select('*')
            .eq('website_slug', slug)
            .single();

          info.specificBroker = specificBroker;
          info.specificError = specificError;
        }

        setDebugInfo(info);
      } catch (error) {
        setDebugInfo({ 
          isCustomDomain: false,
          currentUrl: window.location.href,
          timestamp: new Date().toISOString(),
          rpcException: error.message 
        });
      } finally {
        setLoading(false);
      }
    };

    debugBroker();
  }, [slug, getBrokerByDomainOrSlug, isCustomDomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Coletando informações de debug...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🐛 Debug Broker: {slug || 'N/A'}
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">📊 Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Slug:</strong> {debugInfo.slug || 'N/A'}
            </div>
            <div>
              <strong>Custom Domain:</strong> {debugInfo.isCustomDomain ? 'Sim' : 'Não'}
            </div>
            <div className="col-span-2">
              <strong>URL Atual:</strong> {debugInfo.currentUrl}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">✅ Todos os Brokers no Sistema</h2>
          {debugInfo.brokersError ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <strong>Erro:</strong> {JSON.stringify(debugInfo.brokersError)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Business Name</th>
                    <th className="px-4 py-2 text-left">Website Slug</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {debugInfo.allBrokers?.map(broker => (
                    <tr key={broker.id} className="border-b">
                      <td className="px-4 py-2">{broker.business_name}</td>
                      <td className="px-4 py-2 font-mono bg-gray-100">{broker.website_slug}</td>
                      <td className="px-4 py-2">{broker.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          broker.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {broker.is_active ? 'Sim' : 'Não'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">🔧 Teste Função RPC</h2>
          {debugInfo.rpcError || debugInfo.rpcException ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <strong>Erro RPC:</strong> 
              <pre className="mt-2 text-sm">
                {JSON.stringify(debugInfo.rpcError || debugInfo.rpcException, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <strong>Resultado RPC:</strong>
              <pre className="mt-2 text-sm">
                {JSON.stringify(debugInfo.rpcResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">🪝 Teste Hook useDomainAware</h2>
          {debugInfo.hookException ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <strong>Erro Hook:</strong> {debugInfo.hookException}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <strong>Resultado Hook:</strong>
              <pre className="mt-2 text-sm">
                {JSON.stringify(debugInfo.brokerFromHook, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">🎯 Broker Específico ({slug})</h2>
          {debugInfo.specificError ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <strong>Erro:</strong> {JSON.stringify(debugInfo.specificError)}
            </div>
          ) : debugInfo.specificBroker ? (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <strong>Broker Encontrado:</strong>
              <pre className="mt-2 text-sm">
                {JSON.stringify(debugInfo.specificBroker, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <strong>Nenhum broker encontrado com slug "{slug}"</strong>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-600">📋 Debug Completo</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Debug gerado em: {debugInfo.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;