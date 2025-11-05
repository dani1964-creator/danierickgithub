import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe, CheckCircle2, XCircle, AlertCircle, Copy } from 'lucide-react';
import Head from 'next/head';
import { logger } from '@/lib/logger';

/**
 * Página de Configurações do Site (Slug e Domínio Personalizado)
 * Acesso: {slug}.painel.adminimobiliaria.site/painel/site
 */
export default function WebsiteConfiguration() {
  const { toast } = useToast();
  const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';
  const cnameTarget = process.env.NEXT_PUBLIC_CNAME_TARGET || 'adminimobiliaria.site';
  
  const [websiteSlug, setWebsiteSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [customDomainStatus, setCustomDomainStatus] = useState<'pending' | 'verified' | 'error'>('pending');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // TODO: Carregar dados do broker via API
    // Simulação:
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname.includes('.painel.')) {
      const slug = hostname.split('.painel.')[0];
      setWebsiteSlug(slug);
    }
  }, []);

  const handleSaveSlug = async () => {
    if (!websiteSlug || websiteSlug.length < 3) {
      toast({
        title: 'Slug inválido',
        description: 'O slug deve ter pelo menos 3 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Validar formato do slug (apenas letras minúsculas, números e hífens)
    if (!/^[a-z0-9-]+$/.test(websiteSlug)) {
      toast({
        title: 'Slug inválido',
        description: 'Use apenas letras minúsculas, números e hífens.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Chamar API para atualizar website_slug
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação

      toast({
        title: 'Slug atualizado!',
        description: `Seu site agora está disponível em ${websiteSlug}.${baseDomain}`,
      });
    } catch (error) {
      logger.error('Error saving slug:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o slug.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    if (!customDomain) {
      toast({
        title: 'Domínio inválido',
        description: 'Digite um domínio válido.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Chamar API para salvar custom_domain
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      
      setCustomDomainStatus('pending');
      toast({
        title: 'Domínio salvo!',
        description: 'Configure o DNS conforme as instruções abaixo.',
      });
    } catch (error) {
      logger.error('Error saving custom domain:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o domínio personalizado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!customDomain) return;

    setVerifying(true);
    try {
      // TODO: Chamar API para verificar DNS (verificar se CNAME aponta para o target correto)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulação
      
      // Simulação de verificação
      const isVerified = Math.random() > 0.5;
      
      if (isVerified) {
        setCustomDomainStatus('verified');
        toast({
          title: 'Domínio verificado!',
          description: 'Seu domínio personalizado está configurado corretamente.',
        });
      } else {
        setCustomDomainStatus('error');
        toast({
          title: 'Verificação falhou',
          description: 'O DNS ainda não está configurado corretamente. Aguarde alguns minutos e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error verifying domain:', error);
      setCustomDomainStatus('error');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Head>
        <title>Configurações do Site - Painel</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações do Site</h1>
        <p className="text-muted-foreground">
          Configure o endereço do seu site público e domínio personalizado
        </p>
      </div>

      {/* Slug Amigável (Subdomínio) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Slug Amigável (Subdomínio)</CardTitle>
          <CardDescription>
            Defina o endereço do seu site sob o domínio {baseDomain}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="website-slug">Slug do Site</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="website-slug"
                value={websiteSlug}
                onChange={(e) => setWebsiteSlug(e.target.value.toLowerCase())}
                placeholder="minha-imobiliaria"
                className="flex-1"
              />
              <Button onClick={handleSaveSlug} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Use apenas letras minúsculas, números e hífens
            </p>
          </div>

          {websiteSlug && (
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Seu site estará disponível em:{' '}
                  <strong>{websiteSlug}.{baseDomain}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://${websiteSlug}.${baseDomain}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Domínio Personalizado */}
      <Card>
        <CardHeader>
          <CardTitle>Domínio Personalizado</CardTitle>
          <CardDescription>
            Use seu próprio domínio para o site público (ex: imobiliariajoao.com.br)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-domain">Domínio Personalizado</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                placeholder="imobiliariajoao.com.br"
                className="flex-1"
              />
              <Button onClick={handleSaveCustomDomain} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {customDomain && (
            <>
              {/* Status do Domínio */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {customDomainStatus === 'verified' && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                {customDomainStatus === 'pending' && (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Aguardando Configuração
                  </Badge>
                )}
                {customDomainStatus === 'error' && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Erro na Verificação
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyDomain}
                  disabled={verifying}
                >
                  {verifying ? 'Verificando...' : 'Verificar DNS'}
                </Button>
              </div>

              {/* Instruções DNS */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong className="block mb-2">Configuração DNS (CNAME)</strong>
                  <p className="text-sm mb-3">
                    Configure um registro CNAME no painel do seu provedor de domínios:
                  </p>
                  <div className="bg-muted p-3 rounded font-mono text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>Tipo:</strong> CNAME
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('CNAME')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>Nome:</strong> @ (ou deixe vazio para domínio raiz)
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('@')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>Valor:</strong> {cnameTarget}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cnameTarget)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    ⚠️ A propagação do DNS pode levar de alguns minutos até 48 horas.
                  </p>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
