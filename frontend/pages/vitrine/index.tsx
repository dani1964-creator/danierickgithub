import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { logger } from '@/lib/logger';
import DiagnosticBanner from '@/components/DiagnosticBanner';

/**
 * Homepage da Vitrine Pública
 * Acesso: {slug}.adminimobiliaria.site OU dominio-personalizado.com.br
 * 
 * Esta é a página principal do site público da imobiliária
 */
import { createClient } from '@supabase/supabase-js';
import type { GetServerSideProps } from 'next';
import { getPublicBroker } from '@/lib/publicQueries';

export default function PublicHomepage({ initialTenant }: { initialTenant?: any }) {
  const router = useRouter();
  const [brokerSlug, setBrokerSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [brokerData, setBrokerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBrokerData = useCallback(async () => {
    try {
      // Usar o helper público que resolve broker via Edge Function ou fallback
      const { data, error } = await getPublicBroker();
      if (error) {
        logger.warn('Public broker query não retornou dados:', error);
        setBrokerData(null);
      } else if (data) {
        setBrokerData(data);
        // atualizar slug/domínio localmente caso não tenhamos detectado ainda
        setBrokerSlug((prev) => prev || data.website_slug || '');
        setCustomDomain((prev) => prev || data.custom_domain || '');
      } else {
        setBrokerData(null);
      }
    } catch (error) {
      logger.error('Error loading broker data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || process.env.NEXT_PUBLIC_BASE_DOMAIN || 'adminimobiliaria.site';

    // Detectar se é subdomínio ou domínio personalizado
    if (hostname.endsWith(`.${baseDomain}`) && !hostname.includes('.painel.')) {
      const slug = hostname.split(`.${baseDomain}`)[0];
      setBrokerSlug(slug);
      logger.info(`Public site loaded with slug: ${slug}`);
    } else if (!hostname.includes(baseDomain)) {
      setCustomDomain(hostname);
      logger.info(`Public site loaded with custom domain: ${hostname}`);
    }

    // Se o servidor já injetou o tenant (SSR), usar direto e pular fetch
    if (initialTenant) {
      setBrokerData(initialTenant);
      setBrokerSlug(initialTenant.website_slug || '');
      setCustomDomain(initialTenant.custom_domain || '');
      setLoading(false);
      return;
    }

    // Carregar dados do broker via API usando slug ou custom_domain
    loadBrokerData();
  }, [initialTenant, loadBrokerData]);

  

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
        <title>{brokerData?.business_name || 'Vitrine'}</title>
        <meta name="description" content={brokerData?.description || ''} />
        {initialTenant && (
          <meta name="x-broker-data" content={JSON.stringify(initialTenant)} />
        )}
      </Head>

      {/* Banner de diagnóstico útil para debugging de DNS/hostname */}
      <div className="container mx-auto px-6 pt-6">
        <DiagnosticBanner />
      </div>

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
                onClick={() => router.push('/imoveis')}
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

// Server-side fetch para fornecer dados iniciais da vitrine no HTML (evita flash de marketing)
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const host = (ctx.req.headers.host || '').toLowerCase();
    const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'adminimobiliaria.site').toLowerCase();

    // Usar service role key NO SERVIDOR apenas (NUNCA embutir no cliente)
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      // Não conseguimos fazer consultas seguras no servidor sem a chave apropriada
      return { props: {} };
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    let broker = null;

    if (host.endsWith(`.${baseDomain}`)) {
      const slug = host.split(`.${baseDomain}`)[0];
      const { data, error } = await supabaseAdmin
        .from('brokers')
        .select('*')
        .eq('website_slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!error && data) broker = data;
    } else {
      // domínio customizado
      const { data: domainData, error: domainError } = await supabaseAdmin
        .from('broker_domains')
        .select('broker_id')
        .eq('domain', host)
        .eq('is_active', true)
        .maybeSingle();
      if (!domainError && domainData?.broker_id) {
        const { data: brokerData, error: brokerError } = await supabaseAdmin
          .from('brokers')
          .select('*')
          .eq('id', domainData.broker_id)
          .eq('is_active', true)
          .maybeSingle();
        if (!brokerError && brokerData) broker = brokerData;
      }
    }

    if (!broker) {
      // Não encontrado — retornar props vazias (página client-side pode exibir mensagem)
      return { props: {} };
    }

    // Remover campos sensíveis antes de expor ao cliente
    const safeBroker = { ...broker };
    // Expor apenas os campos públicos necessários
    return { props: { initialTenant: safeBroker } };
  } catch (err) {
    // Em caso de erro, não falhar o build; a página continuará tentando no cliente
    return { props: {} };
  }
};
