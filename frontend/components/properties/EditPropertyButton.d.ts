interface Property {
    id: string;
    title: string;
    description: string | null;
    price: number;
    property_type: string;
    transaction_type: string;
    address: string;
    neighborhood: string | null;
    uf: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_m2: number | null;
    parking_spaces: number | null;
    is_featured: boolean;
    features: string[] | null;
    images: string[] | null;
    property_code: string | null;
    status: string | null;
    realtor_id?: string | null;
    views_count?: number;
    main_image_url?: string;
}
interface EditPropertyButtonProps {
    property: Property;
    onPropertyUpdated: () => void;
}
declare const EditPropertyButton: ({ property, onPropertyUpdated }: EditPropertyButtonProps) => import("react/jsx-runtime").JSX.Element;
export default EditPropertyButton;
