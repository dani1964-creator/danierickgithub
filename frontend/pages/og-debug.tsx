import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BrokerProfile {
  id: string;
  business_name: string;
  website_slug: string;
  logo_url: string | null;
  header_brand_image_url: string | null;
  site_share_image_url: string | null;
  site_title: string | null;
  site_description: string | null;
  primary_color: string | null;
}

export default function OGDebugPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { toast } = useToast();
  const [broker, setBroker] = useState<BrokerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const fetchBroker = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from('brokers')
        .select('id, business_name, website_slug, logo_url, header_brand_image_url, site_share_image_url, site_title, site_description, primary_color')
        .eq('website_slug', slug)
        .single();

      if (error) {
        console.error('Error fetching broker:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados',
          variant: 'destructive',
        });
      } else {
        setBroker(data);
      }
      setLoading(false);
    };

    fetchBroker();
  }, [slug, toast]);

  const getImageUrl = () => {
    if (broker?.site_share_image_url) {
      return broker.site_share_image_url.startsWith('http') 
        ? broker.site_share_image_url 
        : `${origin}${broker.site_share_image_url}`;
    }
    if (broker?.header_brand_image_url) {
      return broker.header_brand_image_url.startsWith('http')
        ? broker.header_brand_image_url
        : `${origin}${broker.header_brand_image_url}`;
    }
    if (broker?.logo_url) {
      return broker.logo_url.startsWith('http')
        ? broker.logo_url
        : `${origin}${broker.logo_url}`;
    }
    return `${origin}/placeholder.svg`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'URL copiada para área de transferência',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Broker não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Não foi possível encontrar o broker com slug: {slug}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const imageUrl = getImageUrl();
  const pageUrl = `${origin}/${broker.website_slug}`;
  const ogTitle = broker.site_title || `${broker.business_name} - Imóveis para Venda e Locação`;
  const ogDescription = broker.site_description || `Encontre seu imóvel dos sonhos com ${broker.business_name}.`;

  return (
    <>
      <Head>
        <title>Debug Open Graph - {broker.business_name}</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Debug Open Graph</h1>
            <p className="mt-2 text-gray-600">{broker.business_name}</p>
          </div>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preview de Compartilhamento</CardTitle>
              <p className="text-sm text-gray-500">Como aparecerá no WhatsApp/Facebook</p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden max-w-md mx-auto bg-white shadow-sm">
                <div className="aspect-[1.91/1] bg-gray-200 relative">
                  {imageUrl.includes('placeholder.svg') ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <p>Sem imagem configurada</p>
                    </div>
                  ) : (
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  )}
                </div>
                <div className="p-3 border-t">
                  <p className="text-xs text-gray-500 uppercase">{broker.website_slug}.adminimobiliaria.site</p>
                  <h3 className="font-semibold text-sm mt-1 line-clamp-2">{ogTitle}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ogDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags Open Graph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetaTagRow label="og:title" value={ogTitle} />
              <MetaTagRow label="og:description" value={ogDescription} />
              <MetaTagRow label="og:image" value={imageUrl} />
              <MetaTagRow label="og:url" value={pageUrl} />
              <MetaTagRow label="og:type" value="website" />
              <MetaTagRow label="og:site_name" value={broker.business_name} />
            </CardContent>
          </Card>

          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ConfigRow 
                label="Imagem de Compartilhamento (site_share_image_url)" 
                value={broker.site_share_image_url}
                status={!!broker.site_share_image_url}
              />
              <ConfigRow 
                label="Logo + Nome 400x80 (header_brand_image_url)" 
                value={broker.header_brand_image_url}
                status={!!broker.header_brand_image_url}
              />
              <ConfigRow 
                label="Logo (logo_url)" 
                value={broker.logo_url}
                status={!!broker.logo_url}
              />
              <ConfigRow 
                label="Título do Site (site_title)" 
                value={broker.site_title}
                status={!!broker.site_title}
              />
              <ConfigRow 
                label="Descrição do Site (site_description)" 
                value={broker.site_description}
                status={!!broker.site_description}
              />
            </CardContent>
          </Card>

          {/* Testing Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas de Teste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TestButton
                label="Facebook Sharing Debugger"
                url={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(pageUrl)}`}
              />
              <TestButton
                label="LinkedIn Post Inspector"
                url={`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(pageUrl)}`}
              />
              <TestButton
                label="Twitter Card Validator"
                url={`https://cards-dev.twitter.com/validator`}
              />
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm">
              <ol className="space-y-2">
                <li>Acesse <code>/dashboard/website</code> → Aba <strong>"SEO e Metadados"</strong></li>
                <li>Faça upload de uma imagem 1200x630px no campo <strong>"Imagem de Compartilhamento"</strong></li>
                <li>Preencha o <strong>"Título do Site"</strong> e <strong>"Descrição"</strong></li>
                <li>Salve as alterações</li>
                <li>Teste usando as ferramentas acima</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function MetaTagRow({ label, value }: { label: string; value: string }) {
  const { toast } = useToast();
  
  const copyValue = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: 'Copiado!',
      description: `${label} copiado`,
    });
  };

  return (
    <div className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <code className="text-xs font-semibold text-blue-600">{label}</code>
        <p className="text-sm text-gray-700 mt-1 break-all">{value}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={copyValue}
        className="flex-shrink-0"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ConfigRow({ label, value, status }: { label: string; value: string | null; status: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500 mt-1 truncate">{value || 'Não configurado'}</p>
      </div>
      <Badge variant={status ? 'default' : 'destructive'} className="flex items-center gap-1">
        {status ? (
          <>
            <CheckCircle2 className="h-3 w-3" />
            OK
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3" />
            Faltando
          </>
        )}
      </Badge>
    </div>
  );
}

function TestButton({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
      <ExternalLink className="h-4 w-4 text-gray-400" />
    </a>
  );
}
