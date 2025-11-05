import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { logger } from '@/lib/logger';

/**
 * Homepage da Vitrine Pública
 * Acesso: {slug}.adminimobiliaria.site OU dominio-personalizado.com.br
 * 
 * Esta é a página principal do site público da imobiliária
 */
export default function PublicHomepage() {
  const router = useRouter();
  const [brokerSlug, setBrokerSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [brokerData, setBrokerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';

    // Detectar se é subdomínio ou domínio personalizado
    if (hostname.endsWith(`.${baseDomain}`) && !hostname.includes('.painel.')) {
      const slug = hostname.split(`.${baseDomain}`)[0];
      setBrokerSlug(slug);
      logger.info(`Public site loaded with slug: ${slug}`);
    } else if (!hostname.includes(baseDomain)) {
      setCustomDomain(hostname);
      logger.info(`Public site loaded with custom domain: ${hostname}`);
    }

    // TODO: Carregar dados do broker via API usando slug ou custom_domain
    loadBrokerData();
  }, []);

  const loadBrokerData = async () => {
    try {
      // TODO: Implementar chamada API
      // const res = await fetch(`/api/public/broker?slug=${brokerSlug || ''}&domain=${customDomain || ''}`);
      // const data = await res.json();
      // setBrokerData(data);
      
      // Simulação temporária
      setBrokerData({
        business_name: 'Imobiliária Exemplo',
        description: 'A melhor imobiliária da região',
        phone: '(11) 99999-9999',
        email: 'contato@exemplo.com',
      });
    } catch (error) {
      logger.error('Error loading broker data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!brokerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Imobiliária não encontrada</h1>
          <p className="text-muted-foreground">
            Esta página não está disponível ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{brokerData.business_name}</title>
        <meta name="description" content={brokerData.description} />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-background py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">{brokerData.business_name}</h1>
            <p className="text-xl text-muted-foreground mb-8">
              {brokerData.description}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/vitrine/imoveis')}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Ver Imóveis
              </button>
              <button
                onClick={() => window.location.href = `tel:${brokerData.phone}`}
                className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/5 transition"
              >
                Entre em Contato
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Imóveis em Destaque</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TODO: Carregar imóveis em destaque */}
            <div className="border rounded-lg p-6 text-center">
              <p className="text-muted-foreground">Nenhum imóvel em destaque</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8 mt-16">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2024 {brokerData.business_name}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
