import { useEffect, useMemo } from 'react';
import type { BrokerProfile } from '@src/types/broker';

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
  const brand = useMemo(() => ({
    primary: broker?.brand_primary ?? null,
    secondary: broker?.brand_secondary ?? null,
    accent: broker?.brand_accent ?? null,
    surface: broker?.brand_surface ?? null,
    surfaceFg: broker?.brand_surface_fg ?? null,
    radius: broker?.brand_radius ?? null,
    cardElevation: broker?.brand_card_elevation ?? null,
  }), [
    broker?.brand_primary,
    broker?.brand_secondary,
    broker?.brand_accent,
    broker?.brand_surface,
    broker?.brand_surface_fg,
    broker?.brand_radius,
    broker?.brand_card_elevation,
  ]);

  useEffect(() => {
    // cores (hex) e números (px/nível)
    // Os campos brand_* podem não existir ainda; ignoramos quando undefined
    // e mantemos os defaults definidos em index.css
    applyVar('--color-primary', brand.primary);
    applyVar('--color-secondary', brand.secondary);
    applyVar('--color-accent', brand.accent);
    applyVar('--surface', brand.surface);
    applyVar('--surface-fg', brand.surfaceFg);

    if (brand.radius != null) {
      applyVar('--radius', `${brand.radius}px`);
    }
    if (brand.cardElevation != null) {
      const level = Math.max(0, Math.min(24, Number(brand.cardElevation) || 8));
      const alpha = Math.min(0.08, 0.02 + level * 0.003);
      const shadow = `0 10px 20px rgba(2,6,23,${alpha}), 0 2px 6px rgba(2,6,23,${alpha * 0.7})`;
      applyVar('--shadow', shadow);
    }
  }, [brand]);

  return <>{children}</>;
}
