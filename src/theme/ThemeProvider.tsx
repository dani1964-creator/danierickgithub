import { useEffect } from 'react';
import type { BrokerProfile } from '@/types/broker';

type Props = {
  broker?: Partial<BrokerProfile> | null;
  children: React.ReactNode;
};

const applyVar = (name: string, value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return;
  const v = typeof value === 'number' ? `${value}` : `${value}`;
  document.documentElement.style.setProperty(name, v);
};

export function ThemeProvider({ broker, children }: Props) {
  useEffect(() => {
    // cores (hex) e números (px/nível)
    // Os campos brand_* podem não existir ainda; ignoramos quando undefined
    // e mantemos os defaults definidos em index.css
    // @ts-ignore - BrokerProfile pode não possuir esses campos ainda
    applyVar('--color-primary', broker?.brand_primary);
    // @ts-ignore
    applyVar('--color-secondary', broker?.brand_secondary);
    // @ts-ignore
    applyVar('--color-accent', broker?.brand_accent);
    // @ts-ignore
    applyVar('--surface', broker?.brand_surface);
    // @ts-ignore
    applyVar('--surface-fg', broker?.brand_surface_fg);

    // @ts-ignore
    if (broker?.brand_radius != null) {
      // @ts-ignore
      applyVar('--radius', `${broker.brand_radius}px`);
    }
    // @ts-ignore
    if (broker?.brand_card_elevation != null) {
      // @ts-ignore
      const level = Math.max(0, Math.min(24, Number(broker.brand_card_elevation) || 8));
      const alpha = Math.min(0.08, 0.02 + level * 0.003);
      const shadow = `0 10px 20px rgba(2,6,23,${alpha}), 0 2px 6px rgba(2,6,23,${alpha * 0.7})`;
      applyVar('--shadow', shadow);
    }
  }, [
    // @ts-ignore
    broker?.brand_primary,
    // @ts-ignore
    broker?.brand_secondary,
    // @ts-ignore
    broker?.brand_accent,
    // @ts-ignore
    broker?.brand_surface,
    // @ts-ignore
    broker?.brand_surface_fg,
    // @ts-ignore
    broker?.brand_radius,
    // @ts-ignore
    broker?.brand_card_elevation,
  ]);

  return <>{children}</>;
}
