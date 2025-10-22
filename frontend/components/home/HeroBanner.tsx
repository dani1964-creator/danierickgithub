import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { BrokerProfile, BrokerContact } from '@/types/broker';

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
        console.error('Error fetching contact info:', error);
        return null;
      }
      
      const contactInfo = data && data.length > 0 ? data[0] : null;
      if (contactInfo) {
        setContactInfo(contactInfo);
        return contactInfo;
      }
      return null;
    } catch (error) {
      console.error('Error fetching contact info:', error);
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
        console.error('Erro ao abrir WhatsApp (profile fallback):', error);
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
        console.error('Erro ao abrir WhatsApp (rpc fallback):', error);
        window.open(`https://wa.me/${currentContactInfo.whatsapp_number}?text=${message}`, '_blank');
        return;
      }
    }

    // If no WhatsApp number available, scroll to contact CTA section as fallback
    document.getElementById('contact-cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (backgroundImage) {
    return (
      <section id="hero" className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60"
            style={{ 
              backgroundColor: overlayColor,
              opacity: `${overlayOpacity}%`
            }}
          />
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-6">
          <div className="content-container max-w-4xl space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
                {brokerProfile?.hero_title || 'Encontre o lar dos seus sonhos'}
              </h1>
              <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
                {brokerProfile?.hero_subtitle || 'Oferecemos os melhores imóveis da região'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <button
                onClick={scrollToSearch}
                className="bg-background text-foreground hover:bg-accent px-6 py-3 text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Explorar Imóveis
              </button>
              <button
                onClick={handleContactClick}
                className="border border-white text-white hover:bg-background hover:text-foreground px-6 py-3 text-base font-medium rounded-lg transition-all duration-200"
              >
                Entrar em Contato
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="hero"
      className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center px-6"
      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}90, ${primaryColor}CC)` }}
    >
      <div className="text-center text-white">
        <div className="content-container max-w-4xl space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
              {brokerProfile?.hero_title || 'Encontre o lar dos seus sonhos'}
            </h1>
            <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              {brokerProfile?.hero_subtitle || 'Oferecemos os melhores imóveis da região'}
            </p>
          </div>
          
           <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
             <button
               onClick={scrollToSearch}
               className="bg-background text-foreground hover:bg-accent px-6 py-3 text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
             >
               Explorar Imóveis
             </button>
             <button
               onClick={handleContactClick}
               className="border border-white text-white hover:bg-background hover:text-foreground px-6 py-3 text-base font-medium rounded-lg transition-all duration-200"
             >
               Entrar em Contato
             </button>
           </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
