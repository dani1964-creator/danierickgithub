'use client';

import { useState } from 'react';
import { useTenant } from '../contexts/TenantContext';

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

export function useLeads(): UseLeadsReturn {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const submitLead = async (leadData: LeadData): Promise<boolean> => {
    if (!tenant) {
      setError('Tenant não identificado');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/public/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-domain': window.location.hostname
        },
        body: JSON.stringify({
          ...leadData,
          lead_source: 'website'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar contato');
      }
      
      const data = await response.json();
      
      setSuccess(true);
      console.log(`✅ Lead submitted successfully for ${tenant.business_name}`);
      
      return true;
      
    } catch (err: any) {
      console.error('Error submitting lead:', err);
      setError(err.message || 'Erro ao enviar contato');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    submitLead,
    loading,
    error,
    success
  };
}