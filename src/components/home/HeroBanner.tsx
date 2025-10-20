import type { BrokerProfile } from '@/types/broker';

interface HeroBannerProps {
  brokerProfile: BrokerProfile;
}

const HeroBanner = ({ brokerProfile }: HeroBannerProps) => {
  const primaryColor = brokerProfile?.primary_color || '#2563eb';
  const secondaryColor = brokerProfile?.secondary_color || '#64748b';
  const backgroundImage = brokerProfile?.background_image_url;
  const overlayColor = brokerProfile?.overlay_color || 'rgba(0,0,0,0.4)';
  const overlayOpacity = brokerProfile?.overlay_opacity || '40';

  if (backgroundImage) {
    return (
    <section id="hero" className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: overlayColor,
              opacity: `${overlayOpacity}%`
            }}
          />
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-6">
          <div className="content-container max-w-5xl space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
              {brokerProfile?.hero_title || 'Encontre o lar dos seus sonhos'}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl opacity-95 max-w-3xl mx-auto font-medium leading-relaxed">
              {brokerProfile?.hero_subtitle || 'Oferecemos os melhores imóveis da região'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="hero"
      className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center px-4"
      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
    >
      <div className="text-center text-white px-6">
        <div className="content-container max-w-5xl space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
            {brokerProfile?.hero_title || 'Encontre o lar dos seus sonhos'}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl opacity-95 max-w-3xl mx-auto font-medium leading-relaxed">
            {brokerProfile?.hero_subtitle || 'Oferecemos os melhores imóveis da região'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
