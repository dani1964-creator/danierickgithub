import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Building2, Users, Globe, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AdminImobiliaria</span>
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
            <a href="https://painel.adminimobiliaria.site" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full sm:w-auto">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
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
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gestão de Imóveis</h3>
            <p className="text-muted-foreground text-sm">
              Cadastre e gerencie seu portfólio completo de imóveis com fotos, descrições e detalhes.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Captação de Leads</h3>
            <p className="text-muted-foreground text-sm">
              Receba e gerencie leads de interessados com integração WhatsApp e notificações em tempo real.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sites Personalizados</h3>
            <p className="text-muted-foreground text-sm">
              Cada corretor tem seu próprio site com domínio personalizado e identidade visual única.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics & SEO</h3>
            <p className="text-muted-foreground text-sm">
              Dashboard com métricas, integração com Google Analytics e otimização para mecanismos de busca.
            </p>
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
            Acesse o painel e comece a gerenciar seus imóveis agora mesmo.
          </p>
          <a href="https://painel.adminimobiliaria.site" target="_blank" rel="noopener noreferrer">
            <Button size="lg">
              Acessar Painel
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 AdminImobiliaria. Sistema de Gestão Imobiliária Multi-Tenant.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
