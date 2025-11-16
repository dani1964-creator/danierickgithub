import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Check, 
  Zap, 
  Shield, 
  Sparkles,
  Copy,
  ArrowLeft,
  Clock,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/integrations/supabase/client';

export default function UpgradePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{
    daysRemaining: number;
    isExpired: boolean;
  } | null>(null);

  const [paymentProof, setPaymentProof] = useState({
    transactionId: '',
    notes: '',
  });

  const loadTrialInfo = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/subscription/trial-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setTrialInfo({
          daysRemaining: data.daysRemaining || 0,
          isExpired: data.daysRemaining <= 0,
        });
      }
    } catch (error) {
      console.error('Error loading trial info:', error);
    }
  }, [router]);

  useEffect(() => {
    loadTrialInfo();
  }, [loadTrialInfo]);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentProof.transactionId) {
      toast({
        title: 'ID da transação obrigatório',
        description: 'Por favor, informe o ID/código da transação PIX.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/subscription/submit-payment-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(paymentProof),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Comprovante enviado!',
          description: 'Em breve sua assinatura será ativada. Você receberá uma notificação.',
        });

        setPaymentProof({ transactionId: '', notes: '' });

        // Redirecionar para página de planos
        setTimeout(() => {
          router.push('/painel/planos');
        }, 2000);
      } else {
        toast({
          title: 'Erro ao enviar comprovante',
          description: data.error || 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Submit proof error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar comprovante. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = () => {
    const pixKey = 'SEU_PIX_AQUI@email.com'; // TODO: Buscar do banco
    navigator.clipboard.writeText(pixKey);
    toast({
      title: 'Copiado!',
      description: 'Chave PIX copiada para área de transferência.',
    });
  };

  const features = [
    'Site personalizado com domínio próprio',
    'Cadastro ilimitado de imóveis',
    'Sistema de CRM para leads',
    'Gestão de corretores',
    'Galeria de fotos otimizada',
    'Suporte técnico prioritário',
    'Atualizações automáticas',
    'Backup diário dos dados',
  ];

  return (
    <>
      <Head>
        <title>Upgrade - R$ 67/mês | AdminImobiliaria</title>
        <meta name="description" content="Faça upgrade e continue usando o melhor sistema de gestão imobiliária." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>

            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Continue Gerenciando sua Imobiliária
              </h1>
              <p className="text-gray-600 text-lg">
                {trialInfo?.isExpired 
                  ? 'Seu período de teste expirou. Faça upgrade agora!'
                  : `Ainda restam ${trialInfo?.daysRemaining || 0} dias do seu trial. Garanta sua vaga!`
                }
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Coluna 1: Plano e Benefícios */}
            <div className="space-y-6">
              <Card className="border-2 border-blue-200 shadow-xl">
                <CardHeader className="text-center pb-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="mx-auto bg-gradient-to-br from-blue-500 to-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl">Plano Profissional</CardTitle>
                  <CardDescription className="text-xl font-bold text-blue-600 mt-2">
                    R$ 67<span className="text-sm font-normal text-gray-500">/mês</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                      <Sparkles className="h-5 w-5" />
                      <span>Por que R$ 67/mês?</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Valor acessível que cobre infraestrutura, armazenamento, domínio, SSL, 
                      CDN e suporte técnico. Sem taxas extras ou surpresas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna 2: Pagamento PIX */}
            <div className="space-y-6">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    Pagamento via PIX
                  </CardTitle>
                  <CardDescription>
                    Faça o pagamento e envie o comprovante para ativação imediata
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Instruções PIX */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Passo a Passo
                    </h3>
                    <ol className="space-y-3 text-sm text-green-800">
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                        <span>Copie a chave PIX abaixo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                        <span>Faça o pagamento de <strong>R$ 67,00</strong> no seu banco</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        <span>Copie o ID da transação</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                        <span>Cole o ID no formulário abaixo e envie</span>
                      </li>
                    </ol>
                  </div>

                  {/* Chave PIX */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Chave PIX</Label>
                    <div className="flex gap-2">
                      <Input 
                        value="contato@adminimobiliaria.com" 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button onClick={copyPixKey} variant="outline">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Clique no botão para copiar</p>
                  </div>

                  {/* Formulário de Comprovante */}
                  <form onSubmit={handleSubmitProof} className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="transactionId">ID da Transação PIX *</Label>
                      <Input
                        id="transactionId"
                        placeholder="Ex: E1234567890ABCDEF..."
                        value={paymentProof.transactionId}
                        onChange={(e) => setPaymentProof({ ...paymentProof, transactionId: e.target.value })}
                        required
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Copie o código da transação do comprovante do seu banco
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="notes">Observações (opcional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Alguma informação adicional..."
                        value={paymentProof.notes}
                        onChange={(e) => setPaymentProof({ ...paymentProof, notes: e.target.value })}
                        disabled={loading}
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6"
                      disabled={loading}
                    >
                      {loading ? 'Enviando...' : '✅ Enviar Comprovante'}
                    </Button>

                    <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Após o envio, sua assinatura será ativada em até 2 horas úteis. 
                        Você receberá uma notificação quando estiver tudo pronto!
                      </span>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Pagamento Seguro</h4>
                      <p className="text-sm text-blue-700">
                        Seus dados estão protegidos. Aceitamos apenas PIX para garantir 
                        segurança e praticidade nas transações.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
