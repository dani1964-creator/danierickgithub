import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface PhoneMockupProps {
  images: string[];
  title: string;
  description: string;
  scrollable?: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ 
  images, 
  title, 
  description,
  scrollable = false 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Auto-scroll para imagens compridas
  useEffect(() => {
    if (!scrollable || images.length === 0) return;

    const interval = setInterval(() => {
      setScrollPosition(prev => {
        // Se chegou ao final, volta ao topo
        if (prev >= 100) return 0;
        // Incrementa gradualmente
        return prev + 0.5;
      });
    }, 50); // Suave, 50ms

    return () => clearInterval(interval);
  }, [scrollable, images]);

  // Alternar entre múltiplas imagens
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
      setScrollPosition(0); // Reset scroll ao trocar imagem
    }, 4000); // Troca a cada 4 segundos

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="feature-card group">
      {/* Phone Frame */}
      <div className="phone-mockup">
        <div className="phone-frame">
          {/* Notch */}
          <div className="phone-notch"></div>
          
          {/* Screen */}
          <div className="phone-screen">
            <div 
              className="phone-screen-content"
              style={{
                transform: scrollable ? `translateY(-${scrollPosition}%)` : 'none',
                transition: 'transform 0.3s ease-out'
              }}
            >
              <Image 
                src={images[currentImageIndex]} 
                alt={title}
                width={280}
                height={606}
                className="phone-screenshot"
                priority={currentImageIndex === 0}
                unoptimized
              />
            </div>
          </div>

          {/* Home Indicator (iOS style) */}
          <div className="phone-home-indicator"></div>
        </div>

        {/* Dots indicator for multiple images */}
        {images.length > 1 && (
          <div className="phone-dots-indicator">
            {images.map((_, index) => (
              <div
                key={index}
                className={`phone-dot ${index === currentImageIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="feature-content">
        <h3 className="feature-title">{title}</h3>
        <p className="feature-description">{description}</p>
      </div>
    </div>
  );
};
