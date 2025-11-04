import { ReactNode } from 'react';
import { TenantData } from '@shared/types/tenant';
interface TenantContextType {
    tenant: TenantData | null;
    loading: boolean;
    error: string | null;
    refetchTenant: () => void;
}
interface TenantProviderProps {
    children: ReactNode;
    initialTenant?: TenantData | null;
}
export declare function TenantProvider({ children, initialTenant }: TenantProviderProps): import("react/jsx-runtime").JSX.Element;
export declare const useTenant: () => TenantContextType;
export declare const useRequireTenant: () => {
    tenant: any;
    loading: boolean;
    error: string;
    isReady: any;
    hasError: string | boolean;
};
export {};
