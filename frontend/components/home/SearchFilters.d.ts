interface SearchFiltersProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    filters: {
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
    };
    setFilters: (filters: {
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
    } | ((prev: SearchFiltersProps['filters']) => SearchFiltersProps['filters'])) => void;
    hasActiveFilters: boolean;
    primaryColor?: string;
    secondaryColor?: string;
    propertyTypeOptions?: {
        value: string;
        label: string;
    }[];
    propertyTypeGroups?: {
        label: string;
        options: {
            value: string;
            label: string;
        }[];
    }[];
}
declare const SearchFilters: ({ searchTerm, setSearchTerm, filters, setFilters, hasActiveFilters, primaryColor, secondaryColor, propertyTypeOptions, propertyTypeGroups }: SearchFiltersProps) => import("react/jsx-runtime").JSX.Element;
export default SearchFilters;
