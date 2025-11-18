import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Building2, Users, Globe, TrendingUp, ArrowRight, CheckCircle, Server, Code, HeadphonesIcon } from 'lucide-react';
import Link from 'next/link';
import { PhoneMockup } from '@/components/marketing/PhoneMockup';

/**
 * Página inicial do domínio principal (adminimobiliaria.site)
 * Página institucional/marketing do sistema
 * 
 * NOTA: Para sites públicos de corretores ({slug}.adminimobiliaria.site),
 * o middleware já faz rewrite automático para /public-site
 */
const Index = () => {
  const router = useRouter();

  // Detectar se está no subdomínio do painel e redirecionar para /auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const baseDomain = process.env.NEXT_PUBLIC_BASE_PUBLIC_DOMAIN || 'adminimobiliaria.site';
      const isPainelSubdomain = hostname === `painel.${baseDomain}` || hostname.startsWith('painel.');

      // Painel: redireciona para /auth
      if (isPainelSubdomain) {
        router.push('/auth');
        return;
      }

      // Sites públicos de corretores ({slug}.adminimobiliaria.site) são tratados
      // pelo middleware que faz rewrite para /public-site automaticamente
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/imobideps-logo.svg" alt="IMOBIDEPS" width={40} height={40} className="h-10 w-auto" />
            <span className="text-xl font-bold">IMOBIDEPS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                Área do Admin
              </Button>
            </Link>
            <a href="https://painel.adminimobiliaria.site" target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                Acessar Painel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Sistema Completo para
            <span className="block text-primary mt-2">Gestão Imobiliária</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma multi-tenant para imobiliárias e corretores autônomos gerenciarem imóveis, leads e sites personalizados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/cadastro">
              <Button size="lg" className="w-full sm:w-auto">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Área Administrativa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <PhoneMockup
            images={['/marketing/gestao-imoveis.png']}
            title="Gestão de Imóveis"
            description="Cadastre e gerencie seu portfólio completo de imóveis com fotos, descrições e detalhes."
          />

          <PhoneMockup
            images={[
              '/marketing/captacao-leads-1.png',
              '/marketing/captacao-leads-2.png'
            ]}
            title="Captação de Leads"
            description="Receba e gerencie leads de interessados com integração WhatsApp e notificações em tempo real."
          />

          <PhoneMockup
            images={['/marketing/sites-personalizados.png']}
            title="Sites Personalizados"
            description="Cada corretor tem seu próprio site com domínio personalizado e identidade visual única."
          />

          <PhoneMockup
            images={[
              '/marketing/analytics-1.png',
              '/marketing/analytics-2.png'
            ]}
            title="Analytics & SEO"
            description="Dashboard com métricas, integração com Google Analytics e otimização para mecanismos de busca."
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Plano Simples e Transparente
          </h2>
          <p className="text-lg text-muted-foreground">
            Um único plano com tudo que você precisa para gerenciar sua imobiliária online.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Plano Mensal</h3>
              <div className="flex items-center justify-center gap-1">
                <span className="text-4xl font-bold text-primary">R$ 67</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">30 dias de teste gratuito</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Site personalizado com domínio</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Gestão completa de imóveis</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Captação e gestão de leads</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Analytics e relatórios</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">Suporte técnico incluso</span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/cadastro">
                <Button size="lg" className="w-full">
                  Começar Teste Gratuito
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">
                Sem compromisso • Cancele quando quiser
              </p>
            </div>
          </div>
        </div>

        {/* Informações sobre custos */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="text-xl font-semibold mb-6">Por que R$ 67/mês?</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-lg bg-muted/50">
              <Server className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <h4 className="font-medium mb-2">Infraestrutura</h4>
              <p className="text-muted-foreground">
                Servidores dedicados, banco de dados e CDN para garantir performance e disponibilidade 24/7.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <Code className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <h4 className="font-medium mb-2">Desenvolvimento</h4>
              <p className="text-muted-foreground">
                Desenvolvimento contínuo, atualizações de segurança e novas funcionalidades regulares.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <HeadphonesIcon className="h-8 w-8 mx-auto mb-3 text-purple-500" />
              <h4 className="font-medium mb-2">Suporte</h4>
              <p className="text-muted-foreground">
                Suporte técnico especializado para ajudar você a aproveitar ao máximo o sistema.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Comece seu teste gratuito de 30 dias agora mesmo. Sem compromisso, sem taxas ocultas.
          </p>
          <Link href="/cadastro">
            <Button size="lg">
              Iniciar Teste Gratuito
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              © 2025 IMOBIDEPS • Sistema de Gestão Imobiliária
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Desenvolvido com <span className="text-red-500">❤</span> pela equipe IMOBIDEPS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
