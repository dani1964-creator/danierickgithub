import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar,
  Clock,
  CreditCard,
  MessageSquare,
  Upload,
  Copy,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  id: string;
  plan_type: string;
  status: string;
  status_label: string;
  trial_start_date?: string;
  trial_end_date?: string;
  current_period_start?: string;
  current_period_end?: string;
  monthly_price_cents: number;
  pix_key?: string;
  pix_qr_code_image_url?: string;
  days_remaining: number;
  notes?: string;
  broker_id: string;
}

interface Communication {
  id: string;
  sender_type: 'admin' | 'client';
  message: string;
  subject?: string;
  is_read: boolean;
  priority: string;
  created_at: string;
}

export default function PlanosPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
    loadCommunications();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      // Buscar dados da assinatura via API
      const response = await fetch('/api/subscription/details');
      const data = await response.json();

      if (response.ok) {
        setSubscription(data.subscription);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar dados da assinatura.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da assinatura.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCommunications = async () => {
    try {
      const response = await fetch('/api/subscription/communications');
      const data = await response.json();

      if (response.ok) {
        setCommunications(data.communications || []);
      }
    } catch (error) {
      console.error('Error loading communications:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma mensagem.',
        variant: 'destructive',
      });
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/subscription/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          subject: newSubject || 'Dúvida sobre assinatura',
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setNewSubject('');
        toast({
          title: 'Sucesso',
          description: 'Mensagem enviada! Aguarde retorno do suporte.',
        });
        loadCommunications();
      } else {
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const copyPixKey = () => {
    if (subscription?.pix_key) {
      navigator.clipboard.writeText(subscription.pix_key);
      toast({
        title: 'Copiado!',
        description: 'Chave PIX copiada para a área de transferência.',
      });
    }
  };

  const getStatusIcon = () => {
    if (!subscription) return null;
    
    switch (subscription.status) {
      case 'trial':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!subscription) return 'secondary';
    
    switch (subscription.status) {
      case 'trial':
        return 'default';
      case 'active':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando dados da assinatura...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Meu Plano</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e informações de pagamento
          </p>
        </div>

        <div className="grid gap-6">
          {/* Status da Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Status da Assinatura
              </CardTitle>
              <CardDescription>
                Informações sobre seu plano atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={getStatusColor()}>
                      {subscription.status_label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tipo de Plano:</span>
                    <span className="capitalize">
                      {subscription.plan_type === 'trial' ? 'Período de Teste' : 'Mensal'}
                    </span>
                  </div>

                  {subscription.status !== 'cancelled' && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Dias restantes:</span>
                      <span className={`font-bold ${
                        subscription.days_remaining <= 3 ? 'text-red-500' : 
                        subscription.days_remaining <= 7 ? 'text-orange-500' : 'text-green-500'
                      }`}>
                        {subscription.days_remaining} dias
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Valor Mensal:</span>
                    <span className="font-bold text-lg">
                      R$ {(subscription.monthly_price_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  {subscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Vence em:</span>
                      <span>
                        {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Nenhuma assinatura encontrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Informações de Pagamento PIX */}
          {subscription && subscription.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagamento via PIX
                </CardTitle>
                <CardDescription>
                  Efetue o pagamento mensal de R$ 67,00 via PIX
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription.pix_qr_code_image_url && (
                  <div className="text-center">
                    <Label className="text-sm font-medium">QR Code para Pagamento</Label>
                    <div className="mt-2 p-4 bg-white rounded-lg inline-block">
                      <img 
                        src={subscription.pix_qr_code_image_url} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Escaneie com seu aplicativo bancário
                    </p>
                  </div>
                )}

                {subscription.pix_key && (
                  <div>
                    <Label htmlFor="pix-key" className="text-sm font-medium">
                      Chave PIX (Copiar e Colar)
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="pix-key"
                        value={subscription.pix_key}
                        readOnly
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyPixKey}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cole esta chave no seu app bancário para fazer o PIX
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instruções de Pagamento</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Valor: R$ 67,00</li>
                    <li>• Pagamento mensal até o vencimento</li>
                    <li>• Após o pagamento, envie o comprovante via mensagem abaixo</li>
                    <li>• A renovação será processada em até 24h</li>
                  </ul>
                </div>

                {subscription.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Observações do Admin</h4>
                    <p className="text-sm text-yellow-800">{subscription.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sistema de Comunicação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comunicação com Suporte
              </CardTitle>
              <CardDescription>
                Envie dúvidas, comprovantes ou solicite suporte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mensagens existentes */}
              {communications.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {communications.map((comm) => (
                    <div
                      key={comm.id}
                      className={`p-3 rounded-lg border ${
                        comm.sender_type === 'admin'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {comm.sender_type === 'admin' ? '🔧 Suporte Admin' : '👤 Você'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comm.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {comm.subject && (
                        <p className="font-medium text-sm mb-1">{comm.subject}</p>
                      )}
                      <p className="text-sm">{comm.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Enviar nova mensagem */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Comprovante de pagamento, Dúvida sobre plano..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite sua mensagem aqui..."
                    rows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>
                
                <Button onClick={sendMessage} disabled={sendingMessage} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {sendingMessage ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}