"use client";

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { logger } from '@/lib/logger';
import DiagnosticBanner from '@/components/DiagnosticBanner';

/**
 * Listagem de Imóveis - Vitrine Pública
 * Acesso: {slug}.adminimobiliaria.site/vitrine/imoveis
 */
export default function PublicProperties() {
  const [brokerSlug, setBrokerSlug] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';

    if (hostname.endsWith(`.${baseDomain}`) && !hostname.includes('.painel.')) {
      const slug = hostname.split(`.${baseDomain}`)[0];
      setBrokerSlug(slug);
    }

    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      // TODO: Carregar imóveis públicos via API
      setProperties([]);
    } catch (error) {
      logger.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Imóveis - Vitrine</title>
      </Head>

      <div className="container mx-auto px-6 py-12">
        <DiagnosticBanner />
        <h1 className="text-4xl font-bold mb-8">Nossos Imóveis</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum imóvel disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {properties.map((property: any) => (
              <div key={property.id} className="border rounded-lg p-4">
                {/* TODO: Card de imóvel */}
                <p>{property.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
