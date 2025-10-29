// Cache simples em memória para pré-carregar dados de detalhes de imóveis
// Chave: `${brokerSlug}|${propertySlug}`

import type { Database } from '@/integrations/supabase/types';
import type { BrokerProfile } from '@src/types/broker';

// O RPC get_public_property_detail_with_realtor retorna um objeto "Property" enriquecido
// Não temos o tipo gerado automaticamente do RPC; definimos um shape mínimo usado no detalhe
export type PublicPropertyDetail = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  property_type: string;
  transaction_type: string;
  uf: string | null;
  main_image_url: string | null;
  images: string[] | null;
  features: string[] | null;
  views_count?: number | null;
  slug?: string | null;
  // Campos opcionais do corretor/relator incluídos no RPC
  realtor_id?: string | null;
  realtor_name?: string | null;
  realtor_avatar_url?: string | null;
  realtor_creci?: string | null;
};

export type PrefetchedDetail = {
  property: PublicPropertyDetail;
  brokerProfile: BrokerProfile | Database['public']['Tables']['brokers']['Row'];
  fetchedAt: number;
};

const CACHE = new Map<string, PrefetchedDetail>();

export function makeDetailKey(brokerSlug: string, propertySlug: string) {
  return `${brokerSlug}|${propertySlug}`;
}

export function setPrefetchedDetail(
  brokerSlug: string,
  propertySlug: string,
  data: Omit<PrefetchedDetail, 'fetchedAt'>
) {
  CACHE.set(makeDetailKey(brokerSlug, propertySlug), {
    ...data,
    fetchedAt: Date.now(),
  });
}

export function getPrefetchedDetail(
  brokerSlug: string,
  propertySlug: string,
  maxAgeMs: number = 60_000 // 1 min padrão
): PrefetchedDetail | null {
  const key = makeDetailKey(brokerSlug, propertySlug);
  const val = CACHE.get(key);
  if (!val) return null;
  if (Date.now() - val.fetchedAt > maxAgeMs) {
    CACHE.delete(key);
    return null;
  }
  return val;
}

export function clearPrefetchedDetail(brokerSlug: string, propertySlug: string) {
  CACHE.delete(makeDetailKey(brokerSlug, propertySlug));
}
