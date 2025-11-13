import { useState, useCallback } from 'react';
import Image from 'next/image';
import { MapPin, Home } from 'lucide-react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  onClick?: () => void;
  fallbackColor?: string;
  onError?: () => void;
}

/**
 * Componente de imagem seguro com fallback profissional
 * Exibe placeholder elegante quando a imagem falha ao carregar
 */
export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  priority,
  loading,
  sizes,
  onClick,
  fallbackColor = '#3b82f6',
  onError,
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Validar URL
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleImageError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      // Retry automático com delay exponencial
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, Math.pow(2, retryCount) * 1000);
    } else {
      setImageError(true);
      onError?.();
    }
  }, [retryCount, MAX_RETRIES, onError]);

  // Se URL inválida ou erro após retries, mostrar fallback
  if (!isValidUrl(src) || imageError) {
    return (
      <div
        className={`relative ${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden`}
        onClick={onClick}
        style={{
          background: `linear-gradient(135deg, ${fallbackColor}15 0%, ${fallbackColor}05 100%)`,
        }}
      >
        {/* Ícone de propriedade */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full p-6 backdrop-blur-sm"
            style={{ backgroundColor: `${fallbackColor}20` }}
          >
            <Home className="h-12 w-12 text-gray-400" strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Pattern decorativo */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Texto explicativo */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Imagem não disponível</p>
        </div>
      </div>
    );
  }

  // Renderizar imagem normal com retry logic
  const imageSrc = retryCount > 0 ? `${src}?retry=${retryCount}` : src;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={`${className} will-change-auto`}
      priority={priority}
      loading={loading}
      sizes={sizes}
      onClick={onClick}
      onError={handleImageError}
      unoptimized={retryCount > 0} // Desabilita otimização em retries para evitar cache
      quality={85} // Otimiza qualidade vs performance
    />
  );
}
