
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, ScrollRestoration } from "react-router-dom";
import { PersistentLayout } from "@/components/layout/PersistentLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { HelmetProvider } from 'react-helmet-async';
import { DomainRouteHandler } from "@/components/layout/DomainRouteHandler";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Properties from "./pages/Properties";
import Settings from "./pages/Settings";
import WebsiteSettings from "./pages/WebsiteSettings";
import Leads from "./pages/Leads";
import Realtors from "./pages/Realtors";
import NotFound from "./pages/NotFound";
import PublicSite from "./pages/PublicSite";
import SuperAdminPage from "./pages/SuperAdmin";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import DebugPage from "./pages/DebugPage";
import SetupBrokerPage from "./pages/SetupBrokerPage";
import SystemDiagnosticPage from "./pages/SystemDiagnostic";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      retry: (failureCount, error) => {
        const status = (error as unknown as { status?: number })?.status;
        if (typeof status === 'number') {
          if (status === 404 || status === 401 || status === 403) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
  },
});

const RootLayout = () => (
  <>
    <ScrollRestoration 
      getKey={(location, matches) => {
        // Para navegação PUSH (nova página), manter scroll atual
        // Para navegação POP (voltar), restaurar posição salva
        return location.key;
      }}
    />
    <PersistentLayout />
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <DomainRouteHandler />
      },
      {
        path: "dashboard",
        element: <Dashboard />
      },
      {
        path: "auth",
        element: <DomainRouteHandler />
      },
      {
        path: "dashboard/home",
        element: <Dashboard />
      },
      {
        path: "dashboard/properties",
        element: <Properties />
      },
      {
        path: "dashboard/settings",
        element: <Settings />
      },
      {
        path: "dashboard/website",
        element: <WebsiteSettings />
      },
      {
        path: "dashboard/leads",
        element: <Leads />
      },
      {
        path: "dashboard/realtors",
        element: <Realtors />
      },
      {
        path: "admin",
        element: <SuperAdminPage />
      },
      {
        path: "super-admin",
        element: <SuperAdminPage />
      },
      {
        path: "dashboard/admin",
        element: <SuperAdminPage />
      },
      {
        path: "debug/:slug",
        element: <DebugPage />
      },
      {
        path: "setup-broker",
        element: <SetupBrokerPage />
      },
      {
        path: "super",
        element: <SuperAdminPage />
      },
      {
        path: "diagnostico",
        element: <SystemDiagnosticPage />
      },
  // Rotas públicas por slug
      {
        path: ":slug",
        element: <PublicSite />
      },
      {
        path: ":slug/:propertySlug",
        element: <PublicSite />
      },
      {
        path: ":slug/sobre-nos",
        element: <AboutUs />
      },
      {
        path: ":slug/politica-de-privacidade",
        element: <PrivacyPolicy />
      },
      {
        path: ":slug/termos-de-uso",
        element: <TermsOfUse />
      },
      // Catch-all routes for custom domains (property slugs without broker slug)
      {
        path: "sobre-nos",
        element: <AboutUs />
      },
      {
        path: "politica-de-privacidade", 
        element: <PrivacyPolicy />
      },
      {
        path: "termos-de-uso",
        element: <TermsOfUse />
      },
      {
        path: "404",
        element: <NotFound />
      },
      {
        path: "*",
        element: <DomainRouteHandler />
      }
    ]
  }
]);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
