import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { NotificationBell } from "./NotificationBell";
import { LogOut, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayoutContent = ({ children }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { openMobile, setOpenMobile, isMobile } = useSidebar();
  
  console.log('📱 DashboardLayout:', { isMobile, openMobile });
  
  // Swipe gesture apenas em mobile
  useSwipeGesture({
    onSwipeRight: () => {
      console.log('🎯 onSwipeRight callback chamado!');
      if (isMobile && !openMobile) {
        console.log('✅ Abrindo menu mobile');
        setOpenMobile(true);
      }
    },
    onSwipeLeft: () => {
      console.log('🎯 onSwipeLeft callback chamado!');
      if (isMobile && openMobile) {
        console.log('✅ Fechando menu mobile');
        setOpenMobile(false);
      }
    },
    enabled: isMobile,
    edgeZoneStart: 50, // Zona segura: não ativa < 50px da borda
    edgeZoneEnd: 200, // Zona ideal: 50-200px da borda
    minDistance: 100, // Precisa arrastar pelo menos 100px
    minVelocity: 0.3, // Swipe rápido (evita ativar em scroll lento)
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao desconectar.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full sticky top-0 z-10">
          <div className="flex h-16 items-center justify-between px-6 w-full">
            <div className="flex items-center gap-4 min-w-0">
              <SidebarTrigger className="hover:bg-accent/80 transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h1 className="font-bold text-lg tracking-tight truncate">Painel Administrativo</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Sair</span>
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto w-full bg-muted/20 min-h-0">
          <div className="animate-fade-in p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;