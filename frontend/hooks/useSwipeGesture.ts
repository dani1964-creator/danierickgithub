import { useEffect, useRef, useCallback } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  edgeZoneStart?: number; // Distância mínima da borda para ativar
  edgeZoneEnd?: number; // Distância máxima da borda para ativar
  minDistance?: number; // Distância mínima de swipe
  minVelocity?: number; // Velocidade mínima do swipe
  enabled?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isDragging: boolean;
}

/**
 * Hook para detectar gestos de swipe com zona segura
 * Evita conflito com gestos de navegação do sistema (back gesture)
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  edgeZoneStart = 50, // Não ativa se tocar < 50px da borda
  edgeZoneEnd = 200, // Zona ideal: 50-200px da borda
  minDistance = 100, // Precisa arrastar pelo menos 100px
  minVelocity = 0.3, // Velocidade mínima (px/ms)
  enabled = true,
}: SwipeConfig) => {
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
  });

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      const screenWidth = window.innerWidth;

      console.log('👆 Touch Start:', { startX, startY, screenWidth, enabled });

      // Para swipe RIGHT (abrir menu): verificar se está na zona esquerda
      const isInLeftZone = startX >= edgeZoneStart && startX <= edgeZoneEnd;
      
      // Para swipe LEFT (fechar menu): permitir de qualquer lugar
      const canSwipe = onSwipeLeft || isInLeftZone;

      if (!canSwipe) {
        console.log('❌ Touch fora da zona segura');
        return;
      }

      console.log('✅ Touch válido - iniciando tracking');
      touchState.current = {
        startX,
        startY,
        startTime: Date.now(),
        isDragging: true,
      };
    },
    [enabled, edgeZoneStart, edgeZoneEnd, onSwipeLeft]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchState.current.isDragging) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;

      // Se movimento vertical for maior que horizontal, cancela (é scroll)
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchState.current.isDragging = false;
        return;
      }

      // Prevenir scroll durante swipe horizontal
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchState.current.isDragging) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;
      const velocity = Math.abs(deltaX) / deltaTime;

      console.log('🖐️ Touch End:', {
        deltaX,
        deltaY,
        deltaTime,
        velocity,
        minDistance,
        minVelocity,
      });

      // Verificar se é swipe válido
      const isValidSwipe =
        Math.abs(deltaX) >= minDistance && // Distância mínima
        Math.abs(deltaX) > Math.abs(deltaY) && // Mais horizontal que vertical
        velocity >= minVelocity; // Velocidade mínima

      console.log('🎯 Swipe válido?', isValidSwipe);

      if (isValidSwipe) {
        if (deltaX > 0 && onSwipeRight) {
          // Swipe para direita (abrir menu)
          console.log('➡️ Swipe RIGHT detectado - abrindo menu');
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          // Swipe para esquerda (fechar menu)
          console.log('⬅️ Swipe LEFT detectado - fechando menu');
          onSwipeLeft();
        }
      }

      touchState.current.isDragging = false;
    },
    [enabled, minDistance, minVelocity, onSwipeLeft, onSwipeRight]
  );

  useEffect(() => {
    if (!enabled) return;

    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isEnabled: enabled };
};
