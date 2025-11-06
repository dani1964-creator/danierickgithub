import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { Home, Building2, Users, Globe, Settings, TrendingUp, Eye, UserPlus, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getErrorMessage } from '@/lib/utils';
// ✅ IMPORT DO HOOK OTIMIZADO
import useDashboardData from '@/hooks/useDashboardData';
import { logger } from '@/lib/logger';


const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [websiteSlug, setWebsiteSlug] = useState<string | null>(null);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState<string | null>(null);

  // ✅ HOOK OTIMIZADO - SUBSTITUI TODAS AS CONSULTAS PESADAS
  const { 
    data: dashboardStats, 
    loading: dashboardLoading, 
    error: dashboardError,
    lastUpdated,
    refresh: refreshDashboard 
  } = useDashboardData(brokerId || '', {
    enableCache: true,
    cacheTTL: 15, // 15 minutos de cache
    enableRealtime: true, // Realtime otimizado
    logQueries: true
  });

  const fetchBrokerProfile = useCallback(async (currentUser: any) => {
    if (!currentUser?.id) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('brokers')
        .select('id, website_slug, custom_domain') // buscar id, slug e domínio personalizado
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) throw error;
      
      // ✅ SETAR ID DO BROKER PARA ATIVAR O HOOK
      setBrokerId(data?.id || null);
      setWebsiteSlug(data?.website_slug || null);
      setCustomDomain(data?.custom_domain || null);
    } catch (error: unknown) {
      logger.error('Error fetching broker profile:', error);
    }
  }, [setBrokerId, setWebsiteSlug, setCustomDomain]);

  useEffect(() => {
    if (user) {
      fetchBrokerProfile(user);
      // ✅ REALTIME AGORA É GERENCIADO PELO useDashboardData hook automaticamente
    }
  }, [user, fetchBrokerProfile]); // Precisa depender do user para executar quando ele estiver disponível

  // Redirect effect for authentication
  useEffect(() => {
    if (!user && !loading) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-24 sm:w-32 bg-muted rounded-md animate-pulse" />
          </div>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 sm:w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 sm:h-8 w-12 sm:w-16 bg-muted rounded animate-pulse mt-2" />
                <div className="h-3 w-16 sm:w-20 bg-muted rounded animate-pulse mt-1" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 sm:h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted rounded-full animate-pulse flex-shrink-0" />
                  <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (dashboardLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-24 sm:w-32 bg-muted rounded-md animate-pulse" />
          </div>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 sm:w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 sm:h-8 w-12 sm:w-16 bg-muted rounded animate-pulse mt-2" />
                <div className="h-3 w-16 sm:w-20 bg-muted rounded animate-pulse mt-1" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 sm:h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted rounded-full animate-pulse flex-shrink-0" />
                  <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Logout realizado com sucesso!"
      });
    }
  };

  const handleViewPublicSite = () => {
    // Prioridade: domínio personalizado -> subdomínio -> path
    if (customDomain) {
      const hasProtocol = customDomain.startsWith('http://') || customDomain.startsWith('https://');
      const url = hasProtocol ? customDomain : `https://${customDomain}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (websiteSlug) {
      // usar subdomínio padrão
      const url = `https://${websiteSlug}.adminimobiliaria.site`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "URL não configurada",
        description: "Configure sua URL nas configurações do site primeiro.",
        variant: "destructive"
      });
    }
  };

  const handleViewDashboardSite = () => {
    // Abre o painel via subdomínio painel.{slug}.adminimobiliaria.site
    if (websiteSlug) {
      const url = `https://${websiteSlug}.painel.adminimobiliaria.site`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "URL do painel não configurada",
        description: "Configure sua URL nas configurações do site primeiro.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Bem-vindo de volta, {user.email?.split('@')[0]}
                </p>
              </div>
            </div>
            
            {/* ✅ BOTÃO DE REFRESH + INFO DE CACHE */}
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Atualizado às {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshDashboard()}
                disabled={dashboardLoading}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${dashboardLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Imóveis Ativos</CardTitle>
                <CardDescription className="text-xs">Total de imóveis publicados</CardDescription>
              </div>
              <Building2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {dashboardLoading ? (
                  <div className="w-12 h-8 bg-muted animate-pulse rounded" />
                ) : dashboardStats?.activeProperties || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(dashboardStats?.activeProperties || 0) === 0 ? 'Nenhum imóvel cadastrado' : 'Disponíveis no site'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Leads do Mês</CardTitle>
                <CardDescription className="text-xs">Contatos recebidos este mês</CardDescription>
              </div>
              <Users className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {dashboardLoading ? (
                  <div className="w-12 h-8 bg-muted animate-pulse rounded" />
                ) : dashboardStats?.totalLeads || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(dashboardStats?.totalLeads || 0) === 0 ? 'Nenhum lead ainda' : 'Novos interessados'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Visualizações</CardTitle>
                <CardDescription className="text-xs">Total de visitas aos imóveis</CardDescription>
              </div>
              <Eye className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                {dashboardLoading ? (
                  <div className="w-12 h-8 bg-muted animate-pulse rounded" />
                ) : '~' + (dashboardStats?.totalProperties ? dashboardStats.totalProperties * 45 : 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {!dashboardStats?.totalProperties || dashboardStats.totalProperties === 0 ? 'Sem visualizações' : 'Total estimado de acessos'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <div className="w-1 h-5 bg-primary rounded-full"></div>
            Ações Rápidas
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              className="h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 bg-primary hover:bg-primary/90"
              onClick={() => router.push('/dashboard/properties')}
            >
              <Building2 className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Adicionar Imóvel</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
              <span className="font-medium">Configurações</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2"
              onClick={() => router.push('/dashboard/leads')}
            >
              <Users className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Gerenciar Leads</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2"
              onClick={handleViewPublicSite}
            >
              <Globe className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Ver Site Público</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 text-sm group hover:scale-105 transition-all duration-200 border-2"
              onClick={handleViewDashboardSite}
            >
              <Settings className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
              <span className="font-medium">Abrir Painel (subdomínio)</span>
            </Button>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="mt-8 bg-gradient-to-br from-card to-muted/20 border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded-md">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Primeiros Passos</CardTitle>
                <CardDescription className="text-sm">
                  Configure sua imobiliária e comece a vender
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-card border transition-all duration-200 hover:shadow-md">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Complete seu perfil e personalize sua marca</p>
                  <p className="text-xs text-muted-foreground">Configure logo, cores e informações da empresa</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => router.push('/dashboard/settings')}
                  className="text-primary hover:text-primary/80"
                >
                  Configurar
                </Button>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-card border transition-all duration-200 hover:shadow-md">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Adicione seu primeiro imóvel</p>
                  <p className="text-xs text-muted-foreground">Comece cadastrando propriedades para venda ou locação</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => router.push('/dashboard/properties')}
                  className="text-primary hover:text-primary/80"
                >
                  Adicionar
                </Button>
              </div>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-card border transition-all duration-200 hover:shadow-md">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Configure pixels de rastreamento</p>
                  <p className="text-xs text-muted-foreground">Adicione Google Analytics, Facebook Pixel, etc.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => router.push('/dashboard/website')}
                  className="text-primary hover:text-primary/80"
                >
                  Configurar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;