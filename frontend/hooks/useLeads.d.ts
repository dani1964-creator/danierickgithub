interface LeadData {
    name: string;
    email: string;
    phone: string;
    message: string;
    property_id?: string;
}
interface UseLeadsReturn {
    submitLead: (leadData: LeadData) => Promise<boolean>;
    loading: boolean;
    error: string | null;
    success: boolean;
}
export declare function useLeads(): UseLeadsReturn;
export {};
