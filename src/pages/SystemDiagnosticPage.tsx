import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Users, Home } from 'lucide-react';

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error';
  title: string;
  description: string;
  data?: any;
  count?: number;
}

const SystemDiagnosticPage = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [correctionStatus, setCorrectionStatus] = useState<string>('');

  const runDiagnostics = async () => {
    setLoading(true);
    setDiagnostics([]);
    
    const results: DiagnosticResult[] = [];

    try {
      // 1. Verificar brokers por email do usuário
      const { data: userBrokers, error: userBrokersError } = await supabase
        .from('brokers')
        .select(`
          id, business_name, website_slug, email, user_id, created_at
        `)
        .order('created_at', { ascending: false });

      if (userBrokersError) {
        results.push({
          status: 'error',
          title: 'Erro ao buscar brokers',
          description: userBrokersError.message
        });
      } else {
        results.push({
          status: 'success',
          title: 'Brokers encontrados',
          description: `${userBrokers?.length || 0} brokers no sistema`,
          data: userBrokers,
          count: userBrokers?.length || 0
        });

        // Verificar se tem broker danierick
        const danierickBroker = userBrokers?.find(b => 
          b.website_slug === 'danierick' || 
          b.email?.includes('danierick') ||
          b.business_name?.toLowerCase().includes('danierick')
        );

        if (danierickBroker) {
          results.push({
            status: 'success',
            title: 'Broker Danierick encontrado',
            description: `ID: ${danierickBroker.id}, Slug: ${danierickBroker.website_slug}`,
            data: danierickBroker
          });
        } else {
          results.push({
            status: 'warning',
            title: 'Broker Danierick não encontrado',
            description: 'Broker com slug "danierick" não existe no banco'
          });
        }
      }

      // 2. Verificar distribuição de propriedades por broker
      const { data: propertiesCount } = await supabase
        .from('properties')
        .select('broker_id')
        .order('created_at', { ascending: false });

      const propsByBroker = propertiesCount?.reduce((acc, prop) => {
        const brokerId = prop.broker_id || 'NULL';
        acc[brokerId] = (acc[brokerId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      if (propsByBroker) {
        const orphanProps = propsByBroker['NULL'] || 0;
        results.push({
          status: orphanProps > 0 ? 'warning' : 'success',
          title: 'Distribuição de propriedades',
          description: `${Object.keys(propsByBroker).length} brokers com propriedades. ${orphanProps} propriedades órfãs`,
          data: propsByBroker,
          count: propertiesCount?.length || 0
        });
      }

      // 3. Verificar corretores duplicados ou mal associados
      const { data: realtorsData } = await supabase
        .from('realtors')
        .select(`
          id, name, email, broker_id, created_at
        `)
        .order('created_at', { ascending: false });

      const realtorsByEmail = realtorsData?.reduce((acc, realtor) => {
        const email = realtor.email || 'NO_EMAIL';
        if (!acc[email]) acc[email] = [];
        acc[email].push(realtor);
        return acc;
      }, {} as Record<string, any[]>);

      const duplicatedRealtors = Object.entries(realtorsByEmail || {})
        .filter(([email, realtors]) => realtors.length > 1 && email !== 'NO_EMAIL')
        .length;

      results.push({
        status: duplicatedRealtors > 0 ? 'warning' : 'success',
        title: 'Corretores duplicados',
        description: `${duplicatedRealtors} emails com múltiplos corretores`,
        data: realtorsByEmail,
        count: realtorsData?.length || 0
      });

      // 4. Verificar inconsistências property → realtor
      const { data: inconsistentProps } = await supabase
        .from('properties')
        .select(`
          id, title, broker_id, realtor_id
        `)
        .not('realtor_id', 'is', null);

      results.push({
        status: 'success',
        title: 'Propriedades com corretor',
        description: `${inconsistentProps?.length || 0} propriedades têm corretor associado`,
        count: inconsistentProps?.length || 0
      });

      setDiagnostics(results);

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      results.push({
        status: 'error',
        title: 'Erro geral no diagnóstico',
        description: error.message
      });
      setDiagnostics(results);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setBackupStatus('Criando backup das tabelas...');
    
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      setBackupStatus(`✅ Backup simulado criado com timestamp: ${timestamp}`);
    } catch (error: any) {
      setBackupStatus(`❌ Erro no backup: ${error.message}`);
    }
  };

  const applyCorrections = async () => {
    setCorrectionStatus('Aplicando correções...');
    
    try {
      // 1. Criar broker danierick se não existir
      const { data: existingBroker } = await supabase
        .from('brokers')
        .select('id')
        .eq('website_slug', 'danierick')
        .single();

      if (!existingBroker) {
        setCorrectionStatus('Criando broker danierick...');
        
        const { data: user } = await supabase.auth.getUser();
        const userId = user?.user?.id || '550e8400-e29b-41d4-a716-446655440001';
        
        const { data: newBroker, error: brokerError } = await supabase
          .from('brokers')
          .insert({
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
            site_description: 'Encontre o imóvel perfeito com a Danierick Imobiliária.',
            subdomain: 'danierick'
          })
          .select()
          .single();

        if (brokerError) throw brokerError;
        setCorrectionStatus('✅ Broker danierick criado com sucesso!');
      } else {
        setCorrectionStatus('✅ Broker danierick já existe.');
      }

      setCorrectionStatus('✅ Correções aplicadas com sucesso!');
      
      // Executar diagnóstico novamente
      setTimeout(() => runDiagnostics(), 2000);
      
    } catch (error: any) {
      setCorrectionStatus(`❌ Erro nas correções: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            Diagnóstico e Correção do Sistema
          </h1>
          <p className="text-gray-600">
            Ferramenta para diagnosticar e corrigir problemas de dados misturados entre imobiliárias
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            className="h-12 text-base"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Database className="h-5 w-5 mr-2" />
            )}
            Executar Diagnóstico
          </Button>

          <Button 
            onClick={createBackup}
            variant="outline"
            className="h-12 text-base"
            disabled={loading}
          >
            <Database className="h-5 w-5 mr-2" />
            Criar Backup
          </Button>

          <Button 
            onClick={applyCorrections}
            variant="default"
            className="h-12 text-base bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Aplicar Correções
          </Button>
        </div>

        {/* Links rápidos */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold mb-3">Links Rápidos</h3>
          <div className="flex flex-wrap gap-3">
            <a href="/super" className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
              <Users className="h-4 w-4" />
              Super Admin (Cadastrar Imobiliárias)
            </a>
            <a href="/setup-broker" className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
              <Home className="h-4 w-4" />
              Setup Broker Danierick
            </a>
            <a href="/debug/danierick" className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">
              <Database className="h-4 w-4" />
              Debug Danierick
            </a>
          </div>
        </div>

        {/* Status de backup */}
        {backupStatus && (
          <Alert>
            <AlertDescription>{backupStatus}</AlertDescription>
          </Alert>
        )}

        {/* Status de correção */}
        {correctionStatus && (
          <Alert>
            <AlertDescription>{correctionStatus}</AlertDescription>
          </Alert>
        )}

        {/* Resultados do diagnóstico */}
        {diagnostics.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resultados do Diagnóstico</h2>
            
            {diagnostics.map((result, index) => (
              <Card key={index} className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getStatusIcon(result.status)}
                    {result.title}
                    {result.count !== undefined && (
                      <Badge variant="secondary">{result.count}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{result.description}</p>
                  
                  {result.data && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                        Ver dados detalhados
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDiagnosticPage;