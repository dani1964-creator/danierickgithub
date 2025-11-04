interface PropertyData {
    id: string;
    title: string;
    description: string;
    price: number;
    property_type: string;
    transaction_type: string;
    bedrooms: number;
    bathrooms: number;
    area_m2: number;
    address: string;
    city: string;
    neighborhood: string;
    main_image_url?: string;
    images: string[];
    property_code: string;
    is_featured: boolean;
    views_count: number;
    created_at: string;
}
interface PropertyFilters {
    type?: string;
    transaction_type?: string;
    min_price?: number;
    max_price?: number;
    city?: string;
    bedrooms?: number;
    bathrooms?: number;
    search?: string;
}
interface UsePropertiesOptions {
    page?: number;
    limit?: number;
    filters?: PropertyFilters;
    enabled?: boolean;
}
interface UsePropertiesReturn {
    properties: PropertyData[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
    refetch: () => void;
}
export declare function useProperties(options?: UsePropertiesOptions): UsePropertiesReturn;
export declare function useProperty(propertyId: string): {
    property: PropertyData;
    loading: boolean;
    error: string;
    refetch: () => Promise<void>;
};
export {};
