import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LeadModal from '@/components/leads/LeadModal';
import type { BrokerProfile, BrokerContact } from '@src/types/broker';
interface ContactCTAProps {
  brokerProfile: BrokerProfile;
}
const ContactCTA = ({
  brokerProfile
}: ContactCTAProps) => {
  const [contactInfo, setContactInfo] = useState<BrokerContact | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const { toast } = useToast();
  const whatsappButtonText = brokerProfile?.whatsapp_button_text || 'Fale com um Corretor';
  const whatsappButtonColor = brokerProfile?.whatsapp_button_color || '#25D366';

  // Fetch contact information using public RPC (no authentication required)
  const fetchContactInfo = useCallback(async () => {
    if (!brokerProfile?.website_slug) {
      console.log('No broker profile or website_slug available for ContactCTA');
      return null;
    }
    try {
      console.log('ContactCTA fetching contact info for:', brokerProfile.website_slug);
      const {
        data,
        error
      } = await supabase.rpc('get_public_broker_contact', {
        broker_website_slug: brokerProfile.website_slug
      });
      console.log('ContactCTA Contact RPC response:', {
        data,
        error
      });
      if (error) {
        console.error('ContactCTA Error fetching contact info:', error);
        return null;
      }
      const contactInfo = data && data.length > 0 ? data[0] : null;
      console.log('ContactCTA Parsed contact info:', contactInfo);
      if (contactInfo) {
        setContactInfo(contactInfo);
        return contactInfo;
      }
      return null;
    } catch (error) {
      console.error('ContactCTA Error fetching contact info:', error);
      return null;
    }
  }, [brokerProfile?.website_slug]);

  // Fetch contact info when component mounts
  useEffect(() => {
    if (brokerProfile?.website_slug) {
      console.log('ContactCTA component loaded, fetching contact info...');
      fetchContactInfo();
    }
  }, [brokerProfile?.website_slug, fetchContactInfo]);
  const handleContactClick = async () => {
    // Fetch contact info if not already loaded
    let currentContactInfo = contactInfo;
    if (!currentContactInfo) {
      currentContactInfo = await fetchContactInfo();
    }
    if (currentContactInfo?.whatsapp_number) {
      const message = encodeURIComponent('Olá! Gostaria de mais informações sobre os imóveis.');

      // Detectar se é mobile para usar link apropriado
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const whatsappUrl = isMobile ? `whatsapp://send?phone=${currentContactInfo.whatsapp_number}&text=${message}` : `https://wa.me/${currentContactInfo.whatsapp_number}?text=${message}`;
      try {
        window.open(whatsappUrl, '_blank');
      } catch (error) {
        console.error('Erro ao abrir WhatsApp:', error);
        // Fallback para web WhatsApp
        window.open(`https://wa.me/${currentContactInfo.whatsapp_number}?text=${message}`, '_blank');
      }
    } else {
      // Show user-friendly error message
      toast({
        title: "Informações de contato não disponíveis",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
      console.warn('ContactCTA: Contact information access denied or not available');
    }
  };
  const handleLeadSuccess = async (_leadData: unknown) => {
    // Após o cadastro bem-sucedido, prosseguir com o WhatsApp
    await handleContactClick();
  };

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div 
        className="py-16 md:py-20 px-6 text-center relative overflow-hidden"
        style={{
          backgroundColor: brokerProfile.primary_color || '#2563eb',
          backgroundImage: brokerProfile.background_image_url ? `url(${brokerProfile.background_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background overlay with gradient */}
        <div 
          className="absolute inset-0 bg-black/20"
          style={{
            backgroundColor: brokerProfile.background_image_url 
              ? `${brokerProfile.overlay_color || '#000000'}${Math.round((parseInt(brokerProfile.overlay_opacity || '50') / 100) * 255).toString(16).padStart(2, '0')}`
              : 'transparent'
          }}
        />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
              Interessado em nossos imóveis?
            </h2>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Cadastre-se para receber informações exclusivas e ser contatado por nossa equipe especializada.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <Button
              onClick={() => setShowLeadModal(true)}
              variant="outline"
              className="border-2 border-white bg-background text-foreground hover:bg-accent px-6 py-3 text-base font-medium rounded-lg transition-all duration-200"
            >
              Receber Informações
            </Button>
          </div>
          
          <div className="pt-4">
            <p className="text-white/70 text-sm">
              Atendimento especializado • Imóveis exclusivos • Resposta rápida
            </p>
          </div>
        </div>
      </div>

      <LeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleLeadSuccess}
        brokerProfile={brokerProfile}
        source="contact_cta"
      />
    </div>
  );
};
export default ContactCTA;