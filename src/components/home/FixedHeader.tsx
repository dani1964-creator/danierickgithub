import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface BrokerProfile {
  id: string;
  business_name: string;
  display_name: string | null;
  logo_url: string | null;
  logo_size?: number | null;
  primary_color: string | null;
  secondary_color: string | null;
  address: string | null;
  cnpj: string | null;
  website_slug: string | null;
}

interface FixedHeaderProps {
  brokerProfile: BrokerProfile;
}

const FixedHeader = ({ brokerProfile }: FixedHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayName = brokerProfile.business_name;

  // Function to handle navigation to home
  const handleGoToHome = () => {
    const homeUrl = `/${brokerProfile.website_slug || ''}`;
    navigate(homeUrl);
  };

  return (
    <header 
      id="header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'backdrop-blur-md shadow-lg' : 'backdrop-blur-sm'
      }`}
      style={{
        backgroundColor: isScrolled 
          ? `${brokerProfile.primary_color || '#2563eb'}15`
          : `${brokerProfile.primary_color || '#2563eb'}10`
      }}
      >
        <div className="content-container px-4">
          <div className="flex items-center justify-start h-14 sm:h-16 md:h-20">
          <button 
            onClick={handleGoToHome}
            className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
            aria-label="Voltar ao início"
          >
            {brokerProfile.logo_url && (
               <div className="flex-shrink-0">
                 <img
                   src={brokerProfile.logo_url}
                   alt={`Logo ${displayName}`}
                   className="object-contain rounded-md"
                   style={{ 
                     height: `${Math.min(brokerProfile.logo_size || 80, 60)}px`,
                     width: 'auto'
                   }}
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                   }}
                 />
               </div>
            )}
            
            <div className="flex flex-col min-w-0">
              <h1 
                className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate"
                style={{ color: brokerProfile.primary_color || '#2563eb' }}
              >
                {displayName}
              </h1>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default FixedHeader;