import { Property } from '@shared/types/tenant';
interface Filters {
    transaction_type: string;
    property_type: string;
    min_price: string;
    max_price: string;
    bedrooms: string;
    neighborhood: string;
    city: string;
    uf: string;
    property_code: string;
    status: string;
}
export declare const usePropertyFilters: (properties: Property[]) => {
    searchTerm: string;
    setSearchTerm: import("react").Dispatch<import("react").SetStateAction<string>>;
    filters: Filters;
    setFilters: import("react").Dispatch<import("react").SetStateAction<Filters>>;
    filteredProperties: Property[];
    featuredProperties: Property[];
    regularProperties: Property[];
    hasActiveFilters: boolean;
};
export {};
