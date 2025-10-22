import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TenantRequest, ApiResponse } from '../types/tenant';

export class PropertiesController {
  
  // Listar propriedades públicas do tenant (site público)
  static async getPublicProperties(req: TenantRequest, res: Response) {
    try {
      const { tenantId, tenant } = req.tenant;
      const {
        page = 1,
        limit = 12,
        type,
        transaction_type,
        min_price,
        max_price,
        city,
        bedrooms,
        bathrooms,
        search
      } = req.query;
      
      console.log(`📋 Loading public properties for tenant: ${tenant.business_name}`);
      
      // Query base para propriedades públicas ativas
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          property_type,
          transaction_type,
          bedrooms,
          bathrooms,
          area_m2,
          address,
          city,
          neighborhood,
          main_image_url,
          images,
          property_code,
          is_featured,
          views_count,
          created_at
        `, { count: 'exact' })
        .eq('broker_id', tenantId)
        .eq('status', 'active')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      
      // Aplicar filtros
      if (type) query = query.eq('property_type', type);
      if (transaction_type) query = query.eq('transaction_type', transaction_type);
      if (min_price) query = query.gte('price', min_price);
      if (max_price) query = query.lte('price', max_price);
      if (city) query = query.ilike('city', `%${city}%`);
      if (bedrooms) query = query.eq('bedrooms', bedrooms);
      if (bathrooms) query = query.eq('bathrooms', bathrooms);
      
      // Busca por texto
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
      }
      
      // Paginação
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 12;
      const offset = (pageNum - 1) * limitNum;
      
      query = query.range(offset, offset + limitNum - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error loading public properties:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} properties for ${tenant.business_name}`);
      
      const response: ApiResponse<any[]> = {
        data: data || [],
        tenant: tenant,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          hasMore: (data?.length || 0) === limitNum
        }
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('Error in getPublicProperties:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao carregar propriedades'
      });
    }
  }
  
  // Obter propriedade específica (site público)
  static async getPublicProperty(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, tenant } = req.tenant;
      const { propertyId } = req.params;
      
      console.log(`📋 Loading property ${propertyId} for tenant: ${tenant.business_name}`);
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          property_type,
          transaction_type,
          bedrooms,
          bathrooms,
          area_m2,
          total_area_m2,
          address,
          city,
          neighborhood,
          zip_code,
          main_image_url,
          images,
          amenities,
          property_code,
          is_featured,
          views_count,
          created_at,
          updated_at
        `)
        .eq('broker_id', tenantId)
        .eq('id', propertyId)
        .eq('status', 'active')
        .eq('is_published', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({
            error: 'Property not found',
            message: 'Propriedade não encontrada'
          });
          return;
        }
        throw error;
      }
      
      // Incrementar contador de visualizações
      await supabase
        .from('properties')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', propertyId);
      
      console.log(`✅ Property loaded: ${data.title}`);
      
      const response: ApiResponse<any> = {
        data: data,
        tenant: tenant
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('Error in getPublicProperty:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao carregar propriedade'
      });
    }
  }
  
  // Listar propriedades para admin (painel administrativo)
  static async getAdminProperties(req: TenantRequest, res: Response) {
    try {
      const { tenantId, tenant } = req.tenant;
      const {
        page = 1,
        limit = 20,
        status,
        type,
        search
      } = req.query;
      
      console.log(`📋 Loading admin properties for tenant: ${tenant.business_name}`);
      
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          price,
          property_type,
          transaction_type,
          status,
          is_published,
          is_featured,
          views_count,
          created_at,
          updated_at,
          main_image_url,
          property_code
        `, { count: 'exact' })
        .eq('broker_id', tenantId)
        .order('created_at', { ascending: false });
      
      // Aplicar filtros
      if (status) query = query.eq('status', status);
      if (type) query = query.eq('property_type', type);
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,property_code.ilike.%${search}%,address.ilike.%${search}%`);
      }
      
      // Paginação
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const offset = (pageNum - 1) * limitNum;
      
      query = query.range(offset, offset + limitNum - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      console.log(`✅ Loaded ${data?.length || 0} admin properties`);
      
      const response: ApiResponse<any[]> = {
        data: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          hasMore: (data?.length || 0) === limitNum
        }
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('Error in getAdminProperties:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao carregar propriedades administrativas'
      });
    }
  }
}