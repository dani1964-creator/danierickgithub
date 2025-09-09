import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LeadModal from '@/components/leads/LeadModal';
interface BrokerProfile {
  id: string;
  business_name: string;
  display_name: string | null;
  website_slug: string | null;
  about_text: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  footer_text: string | null;
  background_image_url: string | null;
  overlay_color: string | null;
  overlay_opacity: string | null;
  whatsapp_button_text: string | null;
  whatsapp_button_color: string | null;
  address: string | null;
  cnpj: string | null;
}
interface BrokerContact {
  whatsapp_number: string | null;
  contact_email: string | null;
  creci: string | null;
}
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
  const fetchContactInfo = async () => {
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
  };

  // Fetch contact info when component mounts
  useEffect(() => {
    if (brokerProfile?.website_slug) {
      console.log('ContactCTA component loaded, fetching contact info...');
      fetchContactInfo();
    }
  }, [brokerProfile]);
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
  const handleLeadSuccess = async (leadData: any) => {
    // Após o cadastro bem-sucedido, prosseguir com o WhatsApp
    await handleContactClick();
  };

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div 
        className="py-16 px-4 text-center"
        style={{
          backgroundColor: brokerProfile.primary_color || '#2563eb',
          backgroundImage: brokerProfile.background_image_url ? `url(${brokerProfile.background_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {brokerProfile.background_image_url && (
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: `${brokerProfile.overlay_color || '#000000'}${Math.round((parseInt(brokerProfile.overlay_opacity || '50') / 100) * 255).toString(16).padStart(2, '0')}`
            }}
          />
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Interessado em nossos imóveis?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Cadastre-se para receber informações exclusivas e ser contatado por nossa equipe especializada.
          </p>
          
          <Button
            onClick={() => setShowLeadModal(true)}
            size="lg"
            className="text-white font-semibold px-8 py-4 text-lg hover:opacity-90 transition-all shadow-lg"
            style={{ 
              backgroundColor: brokerProfile.whatsapp_button_color || '#25D366',
              borderColor: brokerProfile.whatsapp_button_color || '#25D366'
            }}
          >
            {whatsappButtonText}
          </Button>
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