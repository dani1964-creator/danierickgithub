import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Lock, User, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CadastroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.businessName || !formData.ownerName || !formData.email || !formData.password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'Por favor, verifique as senhas digitadas.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '🎉 Cadastro realizado!',
          description: 'Você ganhou 30 dias grátis! Redirecionando...',
        });

        // Aguardar 1.5s e redirecionar para login
        setTimeout(() => {
          router.push('/auth?message=Cadastro realizado com sucesso! Faça login para começar.');
        }, 1500);
      } else {
        toast({
          title: 'Erro no cadastro',
          description: data.error || 'Não foi possível criar sua conta.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar cadastro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Cadastro - 30 Dias Grátis | AdminImobiliaria</title>
        <meta name="description" content="Comece seu teste grátis de 30 dias. Sem cartão de crédito." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Botão voltar */}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para página inicial
          </Link>

          <Card className="shadow-xl border-2">
            <CardHeader className="space-y-3 text-center pb-6">
              <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center">
                <Image src="/imobideps-logo.svg" alt="AdminImobiliaria" width={64} height={64} className="h-16 w-auto" />
              </div>
              
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Comece Grátis Agora
              </CardTitle>
              
              <CardDescription className="text-base">
                <div className="flex items-center justify-center gap-2 text-purple-600 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  30 dias grátis • Sem cartão de crédito
                </div>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome da Imobiliária */}
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    Nome da Imobiliária
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="Ex: Imóveis Prime"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Nome do Proprietário */}
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Seu Nome
                  </Label>
                  <Input
                    id="ownerName"
                    placeholder="Ex: João Silva"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>

                {/* Botão Submit */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-base shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Criando sua conta...' : '🚀 Começar Teste Grátis de 30 Dias'}
                </Button>

                {/* Informações de segurança */}
                <div className="text-xs text-center text-gray-500 space-y-1 pt-2">
                  <p>✅ Sem necessidade de cartão de crédito</p>
                  <p>✅ Cancele a qualquer momento</p>
                  <p>✅ Acesso completo a todas as funcionalidades</p>
                </div>

                {/* Link para login */}
                <div className="text-center text-sm pt-4 border-t">
                  <span className="text-gray-600">Já tem uma conta? </span>
                  <Link href="/auth" className="text-blue-600 hover:text-blue-800 font-semibold">
                    Fazer login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer info */}
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>Ao se cadastrar, você concorda com nossos termos de uso.</p>
          </div>
        </div>
      </div>
    </>
  );
}
