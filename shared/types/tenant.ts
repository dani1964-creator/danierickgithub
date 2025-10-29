// Tipos consolidados para sistema multi-tenant
// Consolidação de: frontend/types/tenant.ts, backend/src/types/tenant.ts, shared/types/tenant.ts

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

// Para Express (backend)
export interface TenantRequest {
  tenant: TenantContext;
  user?: {
    id: string;
    email: string;
    role: string;
    broker_id?: string;
  };
}

// Tipos para entidades principais
export interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  city: string | null;
  status: string | null;
  address: string | null;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  area_m2?: number | null;
  photos: string[] | null;
  property_type: string | null;
  year_built: number | null;
  garage_spots: number | null;
  parking_spaces?: number | null;
  amenities: string | null;
  broker_id: string;
  views_count: number | null;
  created_at: string;
  updated_at: string | null;
  // Campos extras para compatibilidade
  transaction_type?: string;
  uf?: string;
  is_featured?: boolean;
  main_image_url?: string;
  images?: string[];
  features?: string[];
  property_code?: string;
  slug?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_id: string;
  message: string | null;
  broker_id: string;
  created_at: string;
  deal_value: number | null;
  deal_closed_at: string | null;
  commission_value: number | null;
  status: string | null;
  updated_at: string | null;
  property?: Property | null;
}

export interface Realtor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  creci: string | null;
  bio: string | null;
  avatar_url: string | null;
  whatsapp_button_text: string;
  is_active: boolean;
  commission_percentage: number | null;
  broker_id: string;
  created_at: string;
  updated_at: string;
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