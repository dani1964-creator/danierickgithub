/**
 * ============================================================================
 * CONFIGURAÇÕES GERAIS - Perfil do Broker
 * ============================================================================
 * 
 * Esta página gerencia:
 * ✅ Informações do Perfil do Broker
 *    - Dados de contato, endereço, CRECI, etc.
 *    - WhatsApp, telefone, email de contato
 *    - Textos sobre a empresa e rodapé
 * 
 * 💡 Para configurar domínios:
 *    Acesse: Configurações do Site (painel/site)
 *    - Subdomínio SaaS (*.adminimobiliaria.site)
 *    - Domínio personalizado (opcional)
 * 
 * Acesso: painel.adminimobiliaria.site/painel/configuracoes
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { Save, User } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

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

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);

  const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : typeof err === 'string' ? err : 'Erro desconhecido');

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
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>
          
          <div className="border rounded-lg animate-pulse">
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
                    <Label htmlFor="business_name">Nome da Empresa</Label>
                    <Input
                      id="business_name"
                      name="organization"
                      value={profile.business_name || ''}
                      onChange={(e) => updateProfile('business_name', e.target.value)}
                      placeholder="Imobiliária João Silva"
                      autoComplete="organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Nome de Exibição</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name || ''}
                      onChange={(e) => updateProfile('display_name', e.target.value)}
                      placeholder="João Silva Imóveis"
                    />
                  </div>
                </div>

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
                      name="email"
                      type="email"
                      value={profile.contact_email || ''}
                      onChange={(e) => updateProfile('contact_email', e.target.value)}
                      placeholder="contato@imobiliaria.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="tel"
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp para Contato</Label>
                    <Input
                      id="whatsapp_number"
                      name="tel-whatsapp"
                      type="tel"
                      value={profile.whatsapp_number || ''}
                      onChange={(e) => updateProfile('whatsapp_number', e.target.value)}
                      placeholder="5511999999999"
                      autoComplete="tel"
                    />
                    <p className="text-sm text-muted-foreground">
                      Formato: Código do país + DDD + número (sem espaços ou caracteres especiais)
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="creci">CRECI</Label>
                    <Input
                      id="creci"
                      value={profile.creci || ''}
                      onChange={(e) => updateProfile('creci', e.target.value)}
                      placeholder="CRECI 12345-F"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      name="street-address"
                      value={profile.address || ''}
                      onChange={(e) => updateProfile('address', e.target.value)}
                      placeholder="Rua Exemplo, 123 - Cidade/UF"
                      autoComplete="street-address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_text">Sobre a Imobiliária</Label>
                  <Textarea
                    id="about_text"
                    value={profile.about_text || ''}
                    onChange={(e) => updateProfile('about_text', e.target.value)}
                    placeholder="Conte sobre sua imobiliária, experiência, diferenciais..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Texto do Rodapé</Label>
                  <Textarea
                    id="footer_text"
                    value={profile.footer_text || ''}
                    onChange={(e) => updateProfile('footer_text', e.target.value)}
                    placeholder="Texto exibido no rodapé do site público"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
    </DashboardLayout>
  );
};

export default Settings;
