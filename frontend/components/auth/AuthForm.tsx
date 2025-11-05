import { useState } from "react";
import Image from 'next/image';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home, KeyRound, Mail } from "lucide-react";
import { SecurityMonitor } from "@/lib/security-monitor";
import { getErrorMessage } from "@/lib/utils";

const AuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });
  const { toast } = useToast();


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check rate limit for auth attempts
    const rateLimitCheck = await SecurityMonitor.checkAuthRateLimit();
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Muitas tentativas",
        description: "Aguarde alguns minutos antes de tentar novamente.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        await SecurityMonitor.logAuthAttempt(false, signInData.email);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      await SecurityMonitor.logAuthAttempt(true, signInData.email);
      toast({
        title: "Login realizado!",
        description: "Redirecionando para o painel...",
      });

    } catch (error: unknown) {
      await SecurityMonitor.logAuthAttempt(false, signInData.email);
      toast({
        title: "Erro no login",
        description: getErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 w-full h-full m-0 p-4 bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <Image
                src="/imobideps-logo.svg"
                alt="IMOBIDEPS"
                fill
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              IMOBIDEPS
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Sistema de Imóveis — acesse seu painel
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  required
                  className="h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-sm font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Senha
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  required
                  className="h-11 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no IMOBIDEPS"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Novos usuários devem ser cadastrados pelo administrador
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;