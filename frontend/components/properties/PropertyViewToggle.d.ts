interface PropertyViewToggleProps {
    view: 'grid' | 'list';
    onViewChange: (view: 'grid' | 'list') => void;
}
declare const PropertyViewToggle: ({ view, onViewChange }: PropertyViewToggleProps) => import("react/jsx-runtime").JSX.Element;
export default PropertyViewToggle;
