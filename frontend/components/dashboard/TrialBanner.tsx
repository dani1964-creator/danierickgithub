import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, CreditCard, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/integrations/supabase/client';

interface TrialBannerProps {
  brokerId?: string;
}

export default function TrialBanner({ brokerId }: TrialBannerProps) {
  const [trialData, setTrialData] = useState<{
    isTrialing: boolean;
    daysRemaining: number;
    trialEndsAt: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrialStatus();
  }, [brokerId]);

  const loadTrialStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/subscription/trial-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.isTrialing) {
        setTrialData(data);
      }
    } catch (error) {
      console.error('Error loading trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trialData || !trialData.isTrialing || dismissed) {
    return null;
  }

  const { daysRemaining } = trialData;
  const isExpiringSoon = daysRemaining <= 7;
  const isExpired = daysRemaining <= 0;

  // Definir cor e mensagem baseado nos dias restantes
  const getBannerStyle = () => {
    if (isExpired) {
      return {
        variant: 'destructive' as const,
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-900',
        icon: <CreditCard className="h-5 w-5 text-red-600" />,
      };
    }
    if (isExpiringSoon) {
      return {
        variant: 'default' as const,
        bgColor: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-900',
        icon: <Clock className="h-5 w-5 text-orange-600 animate-pulse" />,
      };
    }
    return {
      variant: 'default' as const,
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900',
      icon: <Sparkles className="h-5 w-5 text-blue-600" />,
    };
  };

  const getMessage = () => {
    if (isExpired) {
      return {
        title: '⏰ Seu período de teste expirou',
        description: 'Para continuar usando todas as funcionalidades, faça o upgrade para um plano pago.',
        buttonText: 'Fazer Upgrade Agora',
        buttonVariant: 'destructive' as const,
      };
    }
    if (isExpiringSoon) {
      return {
        title: `⚠️ ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restantes do seu teste grátis`,
        description: 'Não perca acesso! Faça upgrade agora e continue gerenciando seus imóveis sem interrupções.',
        buttonText: 'Ver Planos',
        buttonVariant: 'default' as const,
      };
    }
    return {
      title: `🎉 Você está em período de teste (${daysRemaining} dias restantes)`,
      description: 'Aproveite para explorar todas as funcionalidades do sistema. Quando estiver pronto, faça upgrade para continuar.',
      buttonText: 'Ver Planos',
      buttonVariant: 'outline' as const,
    };
  };

  const style = getBannerStyle();
  const message = getMessage();

  return (
    <Alert className={`${style.bgColor} border-2 mb-6 relative`}>
      {/* Botão de fechar (apenas se não expirou) */}
      {!isExpired && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start gap-4 pr-8">
        <div className="mt-0.5">{style.icon}</div>
        
        <div className="flex-1">
          <AlertDescription className="space-y-3">
            <div>
              <p className={`font-semibold ${style.textColor} text-base`}>
                {message.title}
              </p>
              <p className={`${style.textColor} text-sm mt-1 opacity-90`}>
                {message.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={isExpired ? "/upgrade" : "/painel/planos"}>
                <Button 
                  size="sm" 
                  variant={message.buttonVariant}
                  className="shadow-sm"
                >
                  {message.buttonText}
                </Button>
              </Link>

              {!isExpired && daysRemaining > 7 && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                  className={style.textColor}
                >
                  Lembrar depois
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
