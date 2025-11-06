
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Save, User, Globe2, Plus, Trash2, Copy, CloudCog } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BrokerProfile {
  id: string;
  business_name: string;
  display_name: string;
  email: string;
  contact_email: string;
  phone: string;
  address: string;
  about_text: string;
  footer_text: string;
  whatsapp_number: string;
  creci: string;
}

interface BrokerDomain {
  id: string;
  broker_id: string;
  domain: string;
  is_active: boolean;
  created_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  // Domínios personalizados
  const [domains, setDomains] = useState<BrokerDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL as string) || (typeof window !== 'undefined' ? window.location.origin : '');
  const appHost = (() => {
    try { return new URL(appUrl).host; } catch { return (appUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, ''); }
  })();
  const cnameTarget = (process.env.NEXT_PUBLIC_CNAME_TARGET as string) || appHost;
  const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : typeof err === 'string' ? err : 'Erro desconhecido');
  const isLikelyApex = (d: string) => {
    const dom = normalizeDomain(d);
    if (!dom || !dom.includes('.')) return false;
    const parts = dom.split('.');
    const last2 = parts.slice(-2).join('.');
    const last3 = parts.slice(-3).join('.');
    const brPublic = new Set(['com.br','net.br','org.br','art.br','eco.br','blog.br','tv.br']);
    if (brPublic.has(last2)) {
      // ex.: cliente.com.br => parts === 3 é apex
      return parts.length === 3;
    }
    // gen TLD: apex quando há apenas 2 labels (ex.: cliente.com)
    return parts.length === 2;
  };

  const fetchDomains = useCallback(async (brokerId: string) => {
    try {
      setDomainsLoading(true);
      const { data, error } = await supabase
        .from('broker_domains')
        .select('id, broker_id, domain, is_active, created_at')
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDomains(data || []);
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar domínios',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setDomainsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removido dependências desnecessárias

  const fetchProfile = useCallback(async (currentUser?: typeof user) => {
    const userToUse = currentUser || user;
    if (!userToUse?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('brokers')
        .select('id, business_name, display_name, email, contact_email, phone, address, about_text, footer_text, whatsapp_number, creci')
        .eq('user_id', userToUse.id)
        .single();

      if (error) throw error;
      setProfile(data);
      // Carrega domínios após obter o broker_id
      if (data?.id) {
        fetchDomains(data.id);
      }
    } catch (err: unknown) {
      toast({
        title: "Erro ao carregar perfil",
        description: getErrorMessage(err),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removido dependências para evitar re-renders constantes

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      fetchProfile(user);
    }
  }, [user]); // Precisa depender do user para executar quando ele estiver disponível

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('brokers')
        .update({
          business_name: profile.business_name,
          display_name: profile.display_name,
          contact_email: profile.contact_email,
          phone: profile.phone,
          address: profile.address,
          about_text: profile.about_text,
          footer_text: profile.footer_text,
          whatsapp_number: profile.whatsapp_number,
          creci: profile.creci,
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas configurações foram salvas com sucesso."
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: getErrorMessage(err),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof BrokerProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const normalizeDomain = (value: string) => {
    let v = (value || '').trim().toLowerCase();
    v = v.replace(/^https?:\/\//, '');
    v = v.replace(/\/$/, '');
    return v;
  };

  const isValidDomain = (value: string) => {
    const re = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    return re.test(value);
  };

  const addDomain = async () => {
    if (!profile) return;
    const dom = normalizeDomain(domainInput);
    if (!isValidDomain(dom)) {
      toast({ title: 'Domínio inválido', description: 'Informe um domínio válido. Ex: vitrine.seudominio.com.br', variant: 'destructive' });
      return;
    }
    setSavingDomain(true);
    try {
      const { data, error } = await supabase
        .from('broker_domains')
        .insert({ broker_id: profile.id, domain: dom })
        .select('id, broker_id, domain, is_active, created_at')
        .single();
      if (error) throw error;
      setDomains((prev) => [data as BrokerDomain, ...prev]);
      setDomainInput('');
      toast({ title: 'Domínio adicionado', description: 'Crie um CNAME no seu DNS apontando para o app e aguarde a propagação.' });
      // Tentativa opcional de provisionar automaticamente na DO (se função estiver configurada)
      try {
        const { error: fnError } = await supabase.functions.invoke('domain-provision', {
          body: { domain: (data as BrokerDomain).domain, broker_id: profile.id },
        });
        if (!fnError) {
          toast({ title: 'Provisionamento solicitado', description: 'Solicitação enviada ao provedor para emitir SSL e vincular o domínio.' });
        }
      } catch (_) {
        // silencioso, botão manual abaixo cobre o caso
      }
    } catch (err: unknown) {
      toast({ title: 'Erro ao adicionar domínio', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSavingDomain(false);
    }
  };

  const toggleDomainActive = async (d: BrokerDomain, next: boolean) => {
    try {
      const { error } = await supabase
        .from('broker_domains')
        .update({ is_active: next })
        .eq('id', d.id);
      if (error) throw error;
      setDomains((prev) => prev.map((it) => (it.id === d.id ? { ...it, is_active: next } : it)));
    } catch (err: unknown) {
      toast({ title: 'Erro ao atualizar domínio', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const removeDomain = async (d: BrokerDomain) => {
    if (!confirm(`Remover domínio ${d.domain}?`)) return;
    try {
      const { error } = await supabase
        .from('broker_domains')
        .delete()
        .eq('id', d.id);
      if (error) throw error;
      setDomains((prev) => prev.filter((it) => it.id !== d.id));
      toast({ title: 'Domínio removido' });
    } catch (err: unknown) {
      toast({ title: 'Erro ao remover domínio', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const provisionDomain = async (d: BrokerDomain) => {
    try {
      const { error: fnError } = await supabase.functions.invoke('domain-provision', {
        body: { domain: d.domain, broker_id: profile?.id },
      });
      if (fnError) throw fnError;
      toast({ title: 'Provisionamento solicitado', description: 'Verifique no provedor a emissão do certificado.' });
    } catch (err: unknown) {
      toast({ title: 'Erro ao provisionar domínio', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded-md animate-pulse" />
            </div>
            <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
            </div>
            <div className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar perfil</h3>
              <p className="text-muted-foreground">
                Não foi possível carregar suas configurações.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
              <p className="text-muted-foreground">
                Configure as informações do seu perfil
              </p>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="self-start sm:self-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Configure as informações principais da sua imobiliária
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Autenticação)</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email de Contato</Label>
                    <Input
                      id="contact_email"
                      value={profile.contact_email || ''}
                      onChange={(e) => updateProfile('contact_email', e.target.value)}
                      placeholder="contato@imobiliaria.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp para Contato</Label>
                    <Input
                      id="whatsapp_number"
                      value={profile.whatsapp_number || ''}
                      onChange={(e) => updateProfile('whatsapp_number', e.target.value)}
                      placeholder="5511999999999"
                    />
                    <p className="text-sm text-muted-foreground">
                      Número com código do país (sem símbolos). Ex: 5511999999999
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>

          {/* Domínios personalizados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5" />
                Domínios personalizados
              </CardTitle>
              <CardDescription>
                Cadastre domínios para sua vitrine pública. Crie um registro CNAME no seu provedor de DNS apontando o host para o domínio do app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="custom-domain">Adicionar domínio</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="custom-domain"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="vitrine.seudominio.com.br"
                  />
                  <Button onClick={addDomain} disabled={savingDomain || !domainInput.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    {savingDomain ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
                {domainInput && isLikelyApex(domainInput) && (
                  <p className="text-sm text-amber-600">
                    Detectei que este pode ser um domínio raiz. Para o raiz, use A/AAAA (ou ALIAS/ANAME) conforme instruções do provedor ao adicionar o domínio na plataforma.
                  </p>
                )}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Dica: use exatamente o host que os clientes acessarão (ex.: vitrine.seudominio.com.br ou www.seudominio.com.br).
                  </p>
                  <div className="flex items-center gap-2">
                    <span>CNAME alvo:</span>
                    <code className="px-2 py-0.5 rounded bg-muted text-foreground">{cnameTarget || '-'}</code>
                    {cnameTarget && (
                      <Button type="button" variant="outline" size="icon" onClick={() => navigator.clipboard?.writeText(cnameTarget)} title="Copiar CNAME alvo">
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p>
                    Se o domínio for raiz (sem www), muitos provedores não permitem CNAME no raiz. Nesse caso, use os registros A/AAAA (ou ALIAS/ANAME) conforme instruções do provedor de hospedagem quando você adicionar o domínio na plataforma (ex.: DigitalOcean).
                  </p>
                  <div className="rounded-md border p-3 mt-1 text-foreground bg-card/30">
                    <p className="font-medium mb-1">Guia rápido:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><span className="font-semibold">Subdomínio</span> (ex.: vitrine.cliente.com): criar <span className="font-semibold">CNAME</span> apontando para <code className="px-1 rounded bg-muted">{cnameTarget || 'seu-app-host'}</code>.</li>
                      <li><span className="font-semibold">Domínio raiz</span> (ex.: cliente.com): usar <span className="font-semibold">A/AAAA</span> (ou ALIAS/ANAME) conforme instruções ao adicionar o domínio na plataforma. Isso garante o certificado SSL automático.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domínio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domainsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Carregando...</TableCell>
                      </TableRow>
                    ) : domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Nenhum domínio cadastrado</TableCell>
                      </TableRow>
                    ) : (
                      domains.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.domain}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={d.is_active} onCheckedChange={(v) => toggleDomainActive(d, v)} />
                              <span className="text-sm text-muted-foreground">{d.is_active ? 'Ativo' : 'Inativo'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {new Date(d.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="icon" onClick={() => provisionDomain(d)} title="Provisionar no provedor">
                                <CloudCog className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => removeDomain(d)} title="Excluir domínio">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </div>
    </DashboardLayout>
  );
};

const DynamicSettings = dynamic(() => Promise.resolve(Settings), { ssr: false });
export default DynamicSettings;
