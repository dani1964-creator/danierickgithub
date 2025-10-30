
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { Home, Building2, Users, Settings, BarChart3, Globe, UserCheck } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar-context';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@shared/hooks/useAuth';

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { state, setOpen, open } = useSidebar();
  
  const isCollapsed = state === "collapsed";

  const menuItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
    },
    {
      title: 'Imóveis',
      url: '/dashboard/properties',
      icon: Building2,
    },
    {
      title: 'Leads',
      url: '/dashboard/leads',
      icon: Users,
    },
    {
      title: 'Corretores',
      url: '/dashboard/realtors',
      icon: UserCheck,
    },
    {
      title: 'Site',
      url: '/dashboard/website',
      icon: Globe,
    },
    {
      title: 'Configurações',
      url: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className={`transition-all duration-300 ${!open ? 'w-0 overflow-hidden border-r-0' : ''}`}
      style={{ display: !open ? 'none' : 'flex' }}
    >
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="p-2 bg-primary rounded-lg">
            <Home className="h-5 w-5 text-primary-foreground flex-shrink-0" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight truncate">IMOBIDEPS</h2>
              <p className="text-xs text-muted-foreground truncate">Sistema de Imóveis</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={location.pathname === item.url}
                    tooltip={isCollapsed ? item.title : undefined}
                    className="group transition-all duration-200 hover:bg-sidebar-accent/80 data-[state=open]:bg-sidebar-accent"
                  >
                    <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                    {!isCollapsed && (
                      <span className="font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                        {item.title}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {!isCollapsed && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full group hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200"
              onClick={handleSignOut}
            >
              <span className="group-hover:scale-105 transition-transform duration-200">Sair</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
