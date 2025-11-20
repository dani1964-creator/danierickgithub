/**
 * Extensões temporárias para tipos do Supabase
 * Remove este arquivo após aplicar a migração property_categories no banco
 */

import { Database } from '@/integrations/supabase/types';

declare module '@/integrations/supabase/types' {
  export interface Database {
    public: {
      Tables: Database['public']['Tables'] & {
        property_categories: {
          Row: {
            id: string;
            broker_id: string;
            name: string;
            slug: string;
            description: string | null;
            color: string | null;
            icon: string | null;
            display_order: number;
            is_active: boolean;
            show_on_homepage: boolean;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            broker_id: string;
            name: string;
            slug: string;
            description?: string | null;
            color?: string | null;
            icon?: string | null;
            display_order: number;
            is_active?: boolean;
            show_on_homepage?: boolean;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            broker_id?: string;
            name?: string;
            slug?: string;
            description?: string | null;
            color?: string | null;
            icon?: string | null;
            display_order?: number;
            is_active?: boolean;
            show_on_homepage?: boolean;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [
            {
              foreignKeyName: 'property_categories_broker_id_fkey';
              columns: ['broker_id'];
              referencedRelation: 'brokers';
              referencedColumns: ['id'];
            }
          ];
        };
        property_category_assignments: {
          Row: {
            id: string;
            property_id: string;
            category_id: string;
            broker_id: string;
            assigned_at: string;
            assigned_by: string | null;
          };
          Insert: {
            id?: string;
            property_id: string;
            category_id: string;
            broker_id: string;
            assigned_at?: string;
            assigned_by?: string | null;
          };
          Update: {
            id?: string;
            property_id?: string;
            category_id?: string;
            broker_id?: string;
            assigned_at?: string;
            assigned_by?: string | null;
          };
          Relationships: [
            {
              foreignKeyName: 'property_category_assignments_property_id_fkey';
              columns: ['property_id'];
              referencedRelation: 'properties';
              referencedColumns: ['id'];
            },
            {
              foreignKeyName: 'property_category_assignments_category_id_fkey';
              columns: ['category_id'];
              referencedRelation: 'property_categories';
              referencedColumns: ['id'];
            },
            {
              foreignKeyName: 'property_category_assignments_broker_id_fkey';
              columns: ['broker_id'];
              referencedRelation: 'brokers';
              referencedColumns: ['id'];
            }
          ];
        };
      };
      Functions: Database['public']['Functions'] & {
        get_broker_categories_with_counts: {
          Args: { p_broker_id: string };
          Returns: Array<{
            id: string;
            broker_id: string;
            name: string;
            slug: string;
            description: string | null;
            color: string | null;
            icon: string | null;
            display_order: number;
            is_active: boolean;
            show_on_homepage: boolean;
            properties_count: number;
            created_at: string;
            updated_at: string;
          }>;
        };
        get_category_properties: {
          Args: { 
            p_broker_id: string; 
            p_category_slug: string;
            p_limit: number;
          };
          Returns: Array<any>; // Use existing Property type
        };
        get_homepage_categories_with_properties: {
          Args: { 
            p_broker_id: string; 
            p_properties_per_category: number;
          };
          Returns: Array<{
            id: string;
            name: string;
            slug: string;
            description: string | null;
            color: string | null;
            icon: string | null;
            display_order: number;
            properties: any[]; // JSON aggregated properties
          }>;
        };
      };
    };
  }
}
