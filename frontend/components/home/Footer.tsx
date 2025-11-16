import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Phone, Mail, MapPin, Globe, Twitter, Linkedin, Youtube } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn, FaYoutube, FaGlobe } from 'react-icons/fa';
import type { BrokerProfile, BrokerContact } from '@/shared/types/broker';
import { useCallback } from 'react';
import { useDomainAware } from '@/hooks/useDomainAware';

type SocialLink = {
  id: string | number;
  platform: string;
  url: string;
};

interface FooterProps {
  brokerProfile: BrokerProfile | null;
  socialLinks?: SocialLink[];
  onContactRequest: () => Promise<BrokerContact | null>;
  isDarkMode?: boolean;
}

const Footer = ({ brokerProfile, socialLinks = [], onContactRequest, isDarkMode = false }: FooterProps) => {
  const [contactInfo, setContactInfo] = useState<BrokerContact | null>(null);
  const [contactRequested, setContactRequested] = useState(false);
  const router = useRouter();
  const { isCustomDomain } = useDomainAware();

  // Function to request contact information when needed
  const handleContactRequest = useCallback(async () => {
    if (!contactRequested && !contactInfo) {
      setContactRequested(true);
      const contact = await onContactRequest();
      setContactInfo(contact);
    }
  }, [contactRequested, contactInfo, onContactRequest]);

  // Load contact info when footer is displayed
  useEffect(() => {
    handleContactRequest();
  }, [handleContactRequest]);

  // Mapear ícones modernos do React Icons para as plataformas
  const getIconComponentForPlatform = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return FaFacebookF;
      case 'instagram':
        return FaInstagram;
      case 'twitter':
        return FaTwitter;
      case 'linkedin':
        return FaLinkedinIn;
      case 'youtube':
        return FaYoutube;
      case 'website':
        return FaGlobe;
      default:
        return FaGlobe;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return '#1877F2';
      case 'instagram':
        return '#E4405F';
      case 'linkedin':
        return '#0A66C2';
      case 'twitter':
        return '#1DA1F2';
      case 'youtube':
        return '#FF0000';
      case 'website':
        return brokerProfile?.secondary_color || '#64748b';
      default:
        return brokerProfile?.secondary_color || '#64748b';
    }
  };

  // Formatar número do WhatsApp para exibição
  const formatPhoneForDisplay = (phone: string | null) => {
    if (!phone) return null;
    
    // Se o número começa com 55 (código do Brasil), remove para formatação
    const cleanPhone = phone.startsWith('55') ? phone.slice(2) : phone;
    
    // Formatar como (XX) XXXXX-XXXX
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    }
    
    return phone;
  };

  // Function to handle internal navigation
  const handleInternalNavigation = (path: string) => {
    // Em subdomínios (*.adminimobiliaria.site), não incluir o broker slug na URL
    // Apenas em domínios customizados precisamos incluir o broker slug
    const finalPath = isCustomDomain() 
      ? `/${brokerProfile?.website_slug || ''}${path}`
      : path;
    router.push(finalPath);
  };

  // Verificar se há informações de contato válidas
  const hasContactInfo = contactInfo?.contact_email || contactInfo?.whatsapp_number;
  
  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <footer id="footer" className="bg-background dark:bg-card border-t border-gray-100 dark:border-border py-16 w-full">
        <div className="w-full px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Logo e Informações da Empresa */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center">
                {/* Usar header_brand_image_url se disponível, senão logo_url + nome */}
                {brokerProfile?.header_brand_image_url ? (
                  (() => {
                    const h = Math.min(brokerProfile.logo_size || 80, 40);
                    const w = Math.round(h * 5);
                    return (
                      <div
                        className="relative"
                        style={{
                          height: `${h}px`,
                          width: `${w}px`,
                          maxWidth: '300px'
                        }}
                      >
                        <Image
                          src={brokerProfile.header_brand_image_url}
                          alt={`${brokerProfile.business_name} - Logo e Nome`}
                          width={w}
                          height={h}
                          className="object-contain object-left"
                          sizes="(max-width: 768px) 200px, 300px"
                        />
                      </div>
                    );
                  })()
                ) : (
                  <>
                    {brokerProfile?.logo_url ? (
                      <div 
                        className="relative mr-3"
                        style={{ 
                          height: `${Math.min(brokerProfile.logo_size || 80, 40)}px`,
                          width: `${Math.min(brokerProfile.logo_size || 80, 40) * 2}px`
                        }}
                      >
                        <Image 
                          src={brokerProfile.logo_url} 
                          alt={brokerProfile.business_name} 
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 80px, 160px"
                        />
                      </div>
                    ) : (
                      <div 
                        className="h-8 w-8 rounded-lg text-white flex items-center justify-center text-sm font-semibold mr-3"
                        style={{ backgroundColor: brokerProfile?.primary_color || '#2563eb' }}
                      >
                        {brokerProfile?.business_name?.charAt(0) || 'I'}
                      </div>
                    )}
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {brokerProfile?.business_name || 'Imobiliária'}
                    </span>
                  </>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-md">
                {brokerProfile?.about_text || 'Oferecemos os melhores imóveis da região com atendimento personalizado e especializado.'}
              </p>
              
              {/* Redes Sociais */}
              {socialLinks.length > 0 && (
                <div className="flex space-x-3 pt-2">
                  {socialLinks.map((social) => {
                    const IconComponent = getIconComponentForPlatform(social.platform);
                    const iconColor = getPlatformColor(social.platform);
                    
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105"
                        aria-label={social.platform}
                      >
                        <IconComponent 
                          className="w-4 h-4"
                          style={{ color: iconColor }}
                        />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Contato
              </h3>
              <div className="space-y-3">
                {brokerProfile?.display_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{brokerProfile.display_name}</p>
                    {contactInfo?.creci && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">CRECI: {contactInfo.creci}</p>
                    )}
                  </div>
                )}
                
                {contactInfo?.whatsapp_number && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-200">{formatPhoneForDisplay(contactInfo.whatsapp_number)}</p>
                    </div>
                  </div>
                )}
                
                {contactInfo?.contact_email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-200">{contactInfo.contact_email}</p>
                    </div>
                  </div>
                )}

                {brokerProfile?.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-200 leading-relaxed">{brokerProfile.address}</p>
                    </div>
                  </div>
                )}
                
                {!hasContactInfo && contactRequested && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                    <p className="text-amber-800 dark:text-amber-200 text-xs">
                      Configure suas informações de contato
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Links Úteis */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Links Úteis
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleInternalNavigation('/sobre-nos')}
                  className="block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sobre Nós
                </button>
                <button 
                  onClick={() => handleInternalNavigation('/politica-de-privacidade')}
                  className="block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Política de Privacidade
                </button>
                <button 
                  onClick={() => handleInternalNavigation('/termos-de-uso')}
                  className="block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Termos de Uso
                </button>
              </div>
            </div>
          </div>
          
          {/* Rodapé Bottom */}
          <div className="border-t border-gray-100 dark:border-gray-700 mt-12 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
              <div className="text-center md:text-left">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {brokerProfile?.footer_text || 'Todos os direitos reservados'}
                </p>
                {brokerProfile?.cnpj && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    CNPJ: {brokerProfile.cnpj}
                  </p>
                )}
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  <a 
                    href="https://linkme.bio/danierickp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Desenvolvido por DEPS
                  </a>
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;