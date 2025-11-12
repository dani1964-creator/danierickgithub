import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FavoritesButton } from '@/components/FavoritesButton';
import type { BrokerProfile } from '@/shared/types/broker';

interface FixedHeaderProps {
  brokerProfile: BrokerProfile;
}

const FixedHeader = ({ brokerProfile }: FixedHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

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
    // On the public site the correct home is the host root (e.g. danierick.adminimobiliaria.site)
    // so we must NOT include the broker slug in the path. Previously this pushed to
    // `/${website_slug}` which produced URLs like /danierick.
    router.push('/');
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
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          <button 
            onClick={handleGoToHome}
            className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
            aria-label="Voltar ao início"
          >
            {/* Opção 1: Imagem combinada de logo + nome */}
            {brokerProfile.header_brand_image_url ? (
              <div 
                className="flex-shrink-0 relative"
                style={{ 
                  height: `${Math.min(brokerProfile.logo_size || 80, 60)}px`,
                  width: 'auto',
                  maxWidth: '400px'
                }}
              >
                <Image
                  src={brokerProfile.header_brand_image_url}
                  alt={`${displayName} - Logo e Nome`}
                  fill
                  className="object-contain object-left rounded-md"
                  sizes="(max-width: 768px) 300px, 400px"
                  priority
                />
              </div>
            ) : (
              /* Opção 2: Logo + nome separados (comportamento atual) */
              <>
                {brokerProfile.logo_url && (
                  <div 
                    className="flex-shrink-0 relative"
                    style={{ 
                      height: `${Math.min(brokerProfile.logo_size || 80, 60)}px`,
                      width: `${Math.min(brokerProfile.logo_size || 80, 60) * 2}px`
                    }}
                  >
                    <Image
                      src={brokerProfile.logo_url}
                      alt={`Logo ${displayName}`}
                      fill
                      className="object-contain rounded-md"
                      sizes="(max-width: 768px) 120px, 160px"
                      priority
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
              </>
            )}
          </button>

          {/* Favorites Button */}
          <div className="flex items-center gap-2">
            {/* Desktop version */}
            <div className="hidden sm:block">
              <FavoritesButton variant="minimal" />
            </div>
            {/* Mobile version */}
            <div className="sm:hidden">
              <FavoritesButton variant="icon-only" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FixedHeader;