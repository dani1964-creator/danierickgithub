import { logger } from '@/lib/logger';

/**
 * Helper profissional para validação e sanitização de URLs de imagem
 */

/**
 * Valida se uma URL de imagem é segura e válida
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Apenas HTTP e HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      logger.warn('Invalid image URL protocol:', { url, protocol: urlObj.protocol });
      return false;
    }

    // Verificar se tem extensão de imagem válida (opcional, mas recomendado)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
    const pathname = urlObj.pathname.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => 
      pathname.endsWith(ext) || pathname.includes(ext + '?')
    );

    // Se não tem extensão válida, verificar se é um domínio conhecido (Supabase, etc)
    if (!hasValidExtension) {
      const knownImageHosts = [
        'supabase.co',
        'supabase.com',
        'freepik.com',
        'ibb.co',
        'cloudinary.com',
        'imgix.net',
        's3.amazonaws.com',
      ];

      const isKnownHost = knownImageHosts.some(host => urlObj.hostname.includes(host));
      
      if (!isKnownHost) {
        logger.warn('Image URL without valid extension or known host:', { url, hostname: urlObj.hostname });
      }
    }

    return true;
  } catch (error) {
    logger.warn('Invalid image URL:', { url, error });
    return false;
  }
}

/**
 * Sanitiza URL de imagem removendo parâmetros perigosos
 */
export function sanitizeImageUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Lista de parâmetros seguros para manter
    const safeParams = [
      'width',
      'height',
      'quality',
      'format',
      'fit',
      'crop',
      'auto',
      'dpr',
      'retry',
      // Supabase storage params
      'token',
      'download',
      // Cloudinary params
      'c',
      'w',
      'h',
      'q',
      'f',
    ];

    const newSearchParams = new URLSearchParams();
    urlObj.searchParams.forEach((value, key) => {
      if (safeParams.includes(key.toLowerCase())) {
        newSearchParams.append(key, value);
      }
    });

    urlObj.search = newSearchParams.toString();
    return urlObj.toString();
  } catch (error) {
    logger.warn('Error sanitizing image URL:', { url, error });
    return url;
  }
}

/**
 * Adiciona parâmetros de otimização à URL da imagem
 */
export function optimizeImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  } = {}
): string {
  if (!isValidImageUrl(url)) return url;

  try {
    const urlObj = new URL(url);
    const { width, height, quality = 80, format = 'auto' } = options;

    // Se for Supabase, não adicionar parâmetros (já otimizado)
    if (urlObj.hostname.includes('supabase')) {
      return url;
    }

    // Adicionar parâmetros de otimização genéricos
    if (width) urlObj.searchParams.set('w', width.toString());
    if (height) urlObj.searchParams.set('h', height.toString());
    if (quality) urlObj.searchParams.set('q', quality.toString());
    if (format) urlObj.searchParams.set('format', format);

    return urlObj.toString();
  } catch (error) {
    logger.warn('Error optimizing image URL:', { url, error });
    return url;
  }
}

/**
 * Extrai array de URLs de imagens de uma propriedade, validando cada uma
 */
export function getPropertyImages(
  images: string[] | null | undefined,
  mainImageUrl: string | null | undefined
): string[] {
  const validImages: string[] = [];

  // Adicionar imagens do array
  if (Array.isArray(images)) {
    images.forEach(img => {
      if (isValidImageUrl(img)) {
        validImages.push(sanitizeImageUrl(img));
      }
    });
  }

  // Se não há imagens válidas, tentar usar main_image_url
  if (validImages.length === 0 && isValidImageUrl(mainImageUrl)) {
    validImages.push(sanitizeImageUrl(mainImageUrl!));
  }

  return validImages;
}

/**
 * Gera URL de placeholder baseada no tipo de propriedade
 */
export function getPropertyPlaceholder(propertyType?: string): string {
  const placeholders: Record<string, string> = {
    casa: '/placeholders/house.svg',
    apartamento: '/placeholders/apartment.svg',
    terreno: '/placeholders/land.svg',
    comercial: '/placeholders/commercial.svg',
    rural: '/placeholders/rural.svg',
  };

  const type = propertyType?.toLowerCase() || 'casa';
  return placeholders[type] || placeholders.casa;
}

/**
 * Verifica se a URL da imagem está em cache
 */
export function isImageCached(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(img.complete);
    img.onerror = () => resolve(false);
    img.src = url;

    // Timeout de 100ms
    setTimeout(() => resolve(false), 100);
  });
}

/**
 * Pré-carrega imagens importantes
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const validUrls = urls.filter(isValidImageUrl);
  
  if (validUrls.length === 0) return;

  try {
    await Promise.all(
      validUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
      })
    );
    logger.debug('Images preloaded successfully', { count: validUrls.length });
  } catch (error) {
    logger.warn('Some images failed to preload', { error });
  }
}

/**
 * Calcula dimensões otimizadas baseadas no viewport
 */
export function getOptimizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Manter aspect ratio
  if (width > maxWidth) {
    height = (maxWidth / width) * height;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (maxHeight / height) * width;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}
