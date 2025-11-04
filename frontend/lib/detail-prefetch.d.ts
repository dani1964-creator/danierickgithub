import type { Database } from '@/integrations/supabase/types';
import type { BrokerProfile } from '@src/types/broker';
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
export declare function makeDetailKey(brokerSlug: string, propertySlug: string): string;
export declare function setPrefetchedDetail(brokerSlug: string, propertySlug: string, data: Omit<PrefetchedDetail, 'fetchedAt'>): void;
export declare function getPrefetchedDetail(brokerSlug: string, propertySlug: string, maxAgeMs?: number): PrefetchedDetail | null;
export declare function clearPrefetchedDetail(brokerSlug: string, propertySlug: string): void;
