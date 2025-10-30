import { Request } from "express";

export interface TenantData {
  id: string;
  name: string;
  business_name: string;
  email: string;
  custom_domain?: string;
  subdomain?: string;
  website_slug: string;
  theme_settings: Record<string, unknown>;
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

export interface TenantRequest extends Request {
  tenant: TenantContext;
  user?: {
    id: string;
    email: string;
    role: string;
    broker_id?: string;
  };
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
