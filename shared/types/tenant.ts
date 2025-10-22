// Tipos compartilhados para multi-tenant
export interface TenantData {
  id: string;
  name: string;
  business_name: string;
  email: string;
  custom_domain?: string;
  subdomain?: string;
  website_slug: string;
  theme_settings: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    background_image_url?: string;
    hero_title?: string;
    hero_subtitle?: string;
    about_text?: string;
    footer_text?: string;
    whatsapp_number?: string;
    overlay_color?: string;
    overlay_opacity?: string;
  };
  site_title?: string;
  site_description?: string;
  site_favicon_url?: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  updated_at: string;
}

export interface TenantContext {
  tenantId: string;
  domain: string;
  subdomain?: string;
  customDomain?: string;
  tenant: TenantData;
}

export interface TenantRequest {
  tenant: TenantContext;
  user?: {
    id: string;
    email: string;
    role: string;
    broker_id?: string;
  };
}

// Tipos para filtros e queries
export interface PropertyFilters {
  status?: 'active' | 'sold' | 'rented' | 'inactive';
  property_type?: string;
  transaction_type?: 'sale' | 'rent';
  city?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  tenant?: TenantData;
  pagination?: {
    page: number;
    limit: number;
    total?: number;
    hasMore: boolean;
  };
  error?: string;
  message?: string;
}