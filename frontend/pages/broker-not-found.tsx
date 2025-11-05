import { useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function BrokerNotFound() {
  useEffect(() => {
    // Log para analytics se necessário
    console.log('Broker not found - 404');
  }, []);

  const handleGoBack = () => {
    if (typeof window !== 'undefined') window.history.back();
  };

  const currentHost = typeof window !== 'undefined' ? window.location.host : '';

  return (
    <>
      <Head>
        <title>Vitrine não encontrada - AdminImobiliária</title>
        <meta name="description" content="A vitrine solicitada não foi encontrada ou não está ativa." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Ícone de erro */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center">
              <Search className="w-16 h-16 text-red-500" />
            </div>
          </div>

          {/* Título e descrição */}          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-800">
              Vitrine não encontrada
            </h1>
            <p className="text-xl text-slate-600 max-w-lg mx-auto">
              A vitrine solicitada em <code className="bg-slate-200 px-2 py-1 rounded text-sm font-mono">{currentHost}</code> não foi encontrada ou não está ativa.
            </p>
          </div>

          {/* Possíveis causas */}
          <div className="bg-white rounded-lg shadow-sm p-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-slate-800 mb-3">Possíveis causas:</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• A imobiliária ainda não configurou sua vitrine</li>
              <li>• O link está incorreto ou desatualizado</li>
              <li>• A vitrine foi temporariamente desativada</li>
              <li>• O subdomínio "admin" é reservado para uso do sistema</li>
            </ul>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            
            <Button 
              onClick={() => { if (typeof window !== 'undefined') window.location.href = 'https://adminimobiliaria.site'; }}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir para AdminImobiliária
            </Button>
          </div>

          {/* Footer informativo */}
          <div className="pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Se você é o proprietário desta vitrine, faça login no painel de controle para ativá-la.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const DynamicBrokerNotFound = dynamic(() => Promise.resolve(BrokerNotFound), { ssr: false });
export default DynamicBrokerNotFound;
