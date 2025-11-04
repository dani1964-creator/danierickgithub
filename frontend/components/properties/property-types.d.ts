export type PropertyTypeOption = {
    value: string;
    label: string;
};
export type PropertyTypeGroup = {
    label: string;
    options: PropertyTypeOption[];
};
export declare const PROPERTY_TYPE_GROUPS: PropertyTypeGroup[];
export declare const PROPERTY_TYPE_MAP: Record<string, string>;
