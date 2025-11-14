import { useState, useCallback } from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { BrokerProfile, BrokerContact } from '@/shared/types/broker';

interface HeroBannerProps {
  brokerProfile: BrokerProfile;
  onContactClick?: () => void;
}

const HeroBanner = ({ brokerProfile, onContactClick }: HeroBannerProps) => {
  const [contactInfo, setContactInfo] = useState<BrokerContact | null>(null);
  const { toast } = useToast();
  
  const primaryColor = brokerProfile?.primary_color || '#2563eb';
  const secondaryColor = brokerProfile?.secondary_color || '#64748b';
  const backgroundImage = brokerProfile?.background_image_url;
  const overlayColor = brokerProfile?.overlay_color || 'rgba(0,0,0,0.4)';
  const overlayOpacity = brokerProfile?.overlay_opacity || '40';

  const scrollToSearch = () => {
    document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch contact information using public RPC
  const fetchContactInfo = useCallback(async () => {
    if (!brokerProfile?.website_slug) {
      return null;
    }
    try {
      const { data, error } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: brokerProfile.website_slug
      });
      
      if (error) {
        logger.error('Error fetching contact info:', error);
        return null;
      }
      
      const contactInfo = data && data.length > 0 ? data[0] : null;
      if (contactInfo) {
        setContactInfo(contactInfo);
        return contactInfo;
      }
      return null;
    } catch (error) {
      logger.error('Error fetching contact info:', error);
      return null;
    }
  }, [brokerProfile?.website_slug]);

  const handleContactClick = async () => {
    if (onContactClick) {
      onContactClick();
      return;
    }

    // Prefer explicit broker profile whatsapp_number if configured
    const profileWhatsapp = brokerProfile?.whatsapp_number;
    const message = encodeURIComponent('Ol\u00e1! Gostaria de mais informa\u00e7\u00f5es sobre os im\u00f3veis.');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (profileWhatsapp) {
      const whatsappUrl = isMobile ? `whatsapp://send?phone=${profileWhatsapp}&text=${message}` : `https://wa.me/${profileWhatsapp}?text=${message}`;
      try {
        window.open(whatsappUrl, '_blank');
        return;
      } catch (error) {
        logger.error('Erro ao abrir WhatsApp (profile fallback):', error);
        window.open(`https://wa.me/${profileWhatsapp}?text=${message}`, '_blank');
        return;
      }
    }

    // Fetch contact info if not already loaded and try RPC-provided number
    let currentContactInfo = contactInfo;
    if (!currentContactInfo) {
      currentContactInfo = await fetchContactInfo();
    }

    if (currentContactInfo?.whatsapp_number) {
      const whatsappUrl = isMobile
        ? `whatsapp://send?phone=${currentContactInfo.whatsapp_number}&text=${message}`
        : `https://wa.me/${currentContactInfo.whatsapp_number}?text=${message}`;
      try {
        window.open(whatsappUrl, '_blank');
        return;
      } catch (error) {
        logger.error('Erro ao abrir WhatsApp (rpc fallback):', error);
        window.open(`https://wa.me/${currentContactInfo.whatsapp_number}?text=${message}`, '_blank');
        return;
      }
    }

    // If no WhatsApp number available, scroll to contact CTA section as fallback
    document.getElementById('contact-cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (backgroundImage) {
    return (
      <section id="hero" className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] overflow-hidden">
        {/* Background Image com Parallax Effect */}
        <div className="absolute inset-0 transform scale-105">
          <Image
            src={backgroundImage}
            alt="Banner"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Overlay Gradiente Premium */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/70"
            style={{ 
              backgroundColor: overlayColor,
              opacity: `${overlayOpacity}%`
            }}
          />
          {/* Efeito de vinheta */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/10 to-black/40" />
        </div>
        
        {/* Content Container Premium */}
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-6">
          <div className="ds-container max-w-5xl">
            {/* Animação de entrada */}
            <div className="ds-animate-fade-in space-y-8">
              {/* Títulos com Hierarquia Premium */}
              <div className="space-y-4">
                <h1 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-2xl"
                  style={{
                    textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                    letterSpacing: 'var(--tracking-tight)'
                  }}
                >
                  {brokerProfile?.hero_title || 'Encontre o lar dos seus sonhos'}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl font-medium opacity-95 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                  {brokerProfile?.hero_subtitle || 'Oferecemos os melhores imóveis da região'}
                </p>
              </div>
              
              {/* CTAs com Microinterações Premium */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <button
                  onClick={scrollToSearch}
                  className="group relative overflow-hidden bg-white text-gray-900 hover:bg-white/95 px-8 py-4 text-base font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 min-w-[200px]"
                  style={{
                    boxShadow: '0 10px 40px rgba(255,255,255,0.3)'
                  }}
                >
                  <span className="relative z-10">Explorar Imóveis</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                </button>
                <button
                  onClick={handleContactClick}
                  className="group relative overflow-hidden border-2 border-white/80 backdrop-blur-sm bg-white/10 text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-base font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:border-white min-w-[200px] shadow-lg"
                >
                  <span className="relative z-10">Entrar em Contato</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="hero"
      className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] overflow-hidden flex items-center justify-center px-6"
      style={{ 
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor}E6 50%, ${primaryColor}CC 100%)` 
      }}
    >
      {/* Pattern Overlay Sutil */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center text-white">
        <div className="ds-container max-w-5xl">
          <div className="ds-animate-fade-in space-y-8">
            {/* Títulos Premium */}
            <div className="space-y-4">
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight drop-shadow-2xl"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  letterSpacing: 'var(--tracking-tight)'
                }}
              >
                {brokerProfile?.hero_title || 'Encontre o lar dos seus sonhos'}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-medium opacity-95 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                {brokerProfile?.hero_subtitle || 'Oferecemos os melhores imóveis da região'}
              </p>
            </div>
            
            {/* CTAs Premium */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button
                onClick={scrollToSearch}
                className="group relative overflow-hidden bg-white text-gray-900 hover:bg-white/95 px-8 py-4 text-base font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 min-w-[200px]"
              >
                <span className="relative z-10">Explorar Imóveis</span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
              </button>
              <button
                onClick={handleContactClick}
                className="group relative overflow-hidden border-2 border-white/80 backdrop-blur-sm bg-white/10 text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-base font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:border-white min-w-[200px] shadow-lg"
              >
                <span className="relative z-10">Entrar em Contato</span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
