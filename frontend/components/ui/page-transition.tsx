import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
}

export const PageTransition = ({ children, duration = 300 }: PageTransitionProps) => {
  const router = useRouter();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, displayLocation]);

  return (
    <div
      className={`transition-opacity duration-${duration} ${
        transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'
      }`}
      onTransitionEnd={() => {
        if (transitionStage === 'fadeOut') {
          setDisplayLocation(location);
          setTransitionStage('fadeIn');
        }
      }}
    >
      {children}
    </div>
  );
};