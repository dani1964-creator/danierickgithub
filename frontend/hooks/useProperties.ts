'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useTenant } from '../contexts/TenantContext';

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

export function useProperties(options: UsePropertiesOptions = {}): UsePropertiesReturn {
  const { tenant, loading: tenantLoading } = useTenant();
  const {
    page = 1,
    limit = 12,
    filters = {},
    enabled = true
  } = options;
  
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  
  const fetchProperties = async () => {
    if (!tenant || tenantLoading || !enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      // Construir query string com filtros
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>)
      });
      
      const response = await fetch(`${apiUrl}/api/public/properties?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-domain': window.location.hostname
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar propriedades: ${response.status}`);
      }
      
      const data = await response.json();
      
  setProperties(data.data || []);
  setTotalCount(data.pagination?.total || 0);
  setCurrentPage(data.pagination?.page || 1);

  logger.info(`✅ Loaded ${data.data?.length || 0} properties for ${tenant.business_name}`);
      
    } catch (err: any) {
  logger.error('Error fetching properties:', err);
      setError(err.message || 'Erro ao carregar propriedades');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProperties();
  }, [tenant, page, limit, JSON.stringify(filters), enabled]);
  
  const hasMore = properties.length < totalCount;
  
  return {
    properties,
    loading,
    error,
    totalCount,
    hasMore,
    currentPage,
    refetch: fetchProperties
  };
}

// Hook para uma propriedade específica
export function useProperty(propertyId: string) {
  const { tenant } = useTenant();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProperty = async () => {
    if (!tenant || !propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/public/properties/${propertyId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-domain': window.location.hostname
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Propriedade não encontrada');
        }
        throw new Error(`Erro ao carregar propriedade: ${response.status}`);
      }
      
      const data = await response.json();
      setProperty(data.data);
      
    } catch (err: any) {
  logger.error('Error fetching property:', err);
      setError(err.message || 'Erro ao carregar propriedade');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProperty();
  }, [tenant, propertyId]);
  
  return {
    property,
    loading,
    error,
    refetch: fetchProperty
  };
}