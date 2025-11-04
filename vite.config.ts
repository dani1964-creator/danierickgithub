import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3001,
    // Permitir hosts de desenvolvimento usados nos testes locais/proxy.
    // Evita erro: "Blocked request. This host (...) is not allowed"
    // Lista apenas hosts de dev para segurança; em caso de muitos hosts use 'all'.
    allowedHosts: [
      'bucos.adminimobiliaria.site',
      'teste.adminimobiliaria.site'
    ],
  },
  plugins: [
    react(),
  // Removed componentTagger plugin
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          vendor: [
            "@tanstack/react-query",
            "lucide-react",
            "date-fns",
          ],
          radix: [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
          ],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
}));
