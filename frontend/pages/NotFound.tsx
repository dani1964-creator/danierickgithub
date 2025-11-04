import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-3">
          <h1 className="text-6xl sm:text-7xl font-bold text-foreground tracking-tight">404</h1>
          <p className="text-xl sm:text-2xl font-semibold text-foreground">Página não encontrada</p>
          <p className="text-base text-muted-foreground leading-relaxed">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

const DynamicNotFound = dynamic(() => Promise.resolve(NotFound), { ssr: false });
export default DynamicNotFound;
