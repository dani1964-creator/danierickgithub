import { useState, useEffect, useMemo } from "react";
import { supabase } from "../integrations/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Users, Globe, Trash2, Plus, Eye, EyeOff, ExternalLink, RefreshCw, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Helmet } from 'react-helmet-async';

interface BrokerData {
  id: string;
  business_name: string;
  email: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  website_slug?: string;
  properties_count?: number;
}

export default function SuperAdminPage() {
  const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SA_EMAIL || "";
  const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SA_PASSWORD || "";
  const SUPER_ADMIN_TOKEN_KEY = "sa_auth";

  // Service Role client para SuperAdmin
  const supabaseServiceRole = useMemo(() => createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM"
  ), []);
  const { toast } = useToast();
  
  // Estados simples
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Função simples para buscar brokers
  const fetchBrokers = async () => {
    try {
      setLoading(true);
      
      const { data: brokersData, error: brokersError } = await supabaseServiceRole
        .from('brokers')
        .select('id, business_name, email, is_active, plan_type, created_at, website_slug')
        .order('created_at', { ascending: false });

      if (brokersError) throw brokersError;

      // Buscar contagem de propriedades
      const brokersWithCounts = await Promise.all(
        brokersData.map(async (broker) => {
          const { count } = await supabaseServiceRole
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('broker_id', broker.id);

          return { ...broker, properties_count: count || 0 };
        })
      );

      setBrokers(brokersWithCounts);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as imobiliárias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função simples para toggle status
  const toggleBrokerStatus = async (brokerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('brokers')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', brokerId);
      
      if (error) throw error;
      
      // Atualizar estado local
      setBrokers(prev => prev.map(broker => 
        broker.id === brokerId 
          ? { ...broker, is_active: !currentStatus }
          : broker
      ));

      toast({
        title: "Status atualizado",
        description: `Imobiliária ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });

    } catch (error) {
      console.error('Error toggling broker status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  // Login
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha para fazer login.",
        variant: "destructive",
      });
      return;
    }

    setLoginLoading(true);
    try {
      if (loginEmail === SUPER_ADMIN_EMAIL && loginPassword === SUPER_ADMIN_PASSWORD) {
        localStorage.setItem(SUPER_ADMIN_TOKEN_KEY, "1");
        setIsAuthorized(true);
        setShowLoginDialog(false);
        setLoginEmail("");
        setLoginPassword("");
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao painel Super Admin.",
        });
        fetchBrokers();
      } else {
        throw new Error("Credenciais inválidas.");
      }
    } catch (error: unknown) {
      console.error('Error logging in:', error);
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do painel Super Admin.",
    });
    window.location.reload();
  };

  // Verificar auth no mount
  useEffect(() => {
    const token = localStorage.getItem(SUPER_ADMIN_TOKEN_KEY);
    if (token === "1") {
      setIsAuthorized(true);
      fetchBrokers();
    } else {
      setIsAuthorized(false);
      setShowLoginDialog(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando painel de administração...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página. Apenas super administradores podem acessar o painel de controle.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Dialog open={showLoginDialog} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Acesso Super Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faça login com suas credenciais de super administrador para acessar o painel.
              </p>
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="erickjq123@gmail.com"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div>
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full"
                disabled={loginLoading}
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const totalBrokers = brokers.length;
  const activeBrokers = brokers.filter(b => b.is_active).length;
  const totalProperties = brokers.reduce((sum, broker) => sum + (broker.properties_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Super Admin — Controle de Imobiliárias</title>
        <meta name="description" content="Painel do super admin para gerenciar imobiliárias, acessos e sites." />
        <link rel="canonical" href={`${window.location.origin}/admin`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="container mx-auto p-3 sm:p-6">
        <div className="mb-6 sm:mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel Super Admin</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie todas as imobiliárias e seus acessos no sistema
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Imobiliárias</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBrokers}</div>
              <p className="text-xs text-muted-foreground">
                {activeBrokers} ativas de {totalBrokers} totais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imobiliárias Ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBrokers}</div>
              <p className="text-xs text-muted-foreground">
                {totalBrokers > 0 ? ((activeBrokers / totalBrokers) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Imóveis</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                Todos os imóveis cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Gerenciar Imobiliárias</h2>
          </div>
          
          <Button onClick={fetchBrokers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
        </div>

        {/* Brokers Table - Desktop */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            {brokers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma imobiliária encontrada.</p>
                <Button
                  variant="outline"
                  onClick={fetchBrokers}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Empresa</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[80px]">Plano</TableHead>
                      <TableHead className="min-w-[80px]">Imóveis</TableHead>
                      <TableHead className="min-w-[60px]">Site</TableHead>
                      <TableHead className="min-w-[100px]">Criado em</TableHead>
                      <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokers.map((broker) => (
                      <TableRow key={broker.id}>
                        <TableCell className="min-w-[150px]">
                          <div className="font-medium text-sm">{broker.business_name}</div>
                        </TableCell>
                        <TableCell className="min-w-[200px] text-sm">{broker.email}</TableCell>
                        <TableCell className="min-w-[80px]">
                          <Badge variant={broker.is_active ? "default" : "secondary"} className="text-xs">
                            {broker.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[80px]">
                          <Badge variant="outline" className="text-xs">{broker.plan_type}</Badge>
                        </TableCell>
                        <TableCell className="min-w-[80px] text-sm">
                          {broker.properties_count || 0}
                        </TableCell>
                        <TableCell className="min-w-[60px]">
                          {broker.website_slug && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/${broker.website_slug}`, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[100px] text-sm">
                          {format(new Date(broker.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right min-w-[100px]">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBrokerStatus(broker.id, broker.is_active)}
                              className="h-8 w-8 p-0"
                            >
                              {broker.is_active ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brokers Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {brokers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma imobiliária encontrada.</p>
              <Button
                variant="outline"
                onClick={fetchBrokers}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </Card>
          ) : (
            brokers.map((broker) => (
              <Card key={broker.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{broker.business_name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{broker.email}</p>
                    </div>
                    <Badge variant={broker.is_active ? "default" : "secondary"} className="text-xs ml-2">
                      {broker.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Plano</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {broker.plan_type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Imóveis</p>
                      <p className="text-sm font-medium">{broker.properties_count || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => toggleBrokerStatus(broker.id, broker.is_active)}
                    >
                      {broker.is_active ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}