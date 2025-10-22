import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TenantRequest, ApiResponse, TenantData } from '../types/tenant';

export class TenantController {
  
  // Obter informações públicas do tenant
  static async getTenantInfo(req: TenantRequest, res: Response) {
    try {
      const { tenant } = req.tenant;
      
      // Dados públicos seguros para exposição
      const publicTenantData = {
        id: tenant.id,
        name: tenant.name,
        business_name: tenant.business_name,
        website_slug: tenant.website_slug,
        theme_settings: tenant.theme_settings,
        site_title: tenant.site_title,
        site_description: tenant.site_description,
        site_favicon_url: tenant.site_favicon_url,
      };
      
      const response: ApiResponse<any> = {
        data: publicTenantData,
        tenant: tenant
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('Error getting tenant info:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao obter informações do tenant'
      });
    }
  }
  
  // Identificar tenant por domínio (usado pelo middleware frontend)
  static async identifyByDomain(req: Request, res: Response): Promise<void> {
    try {
      const { domain } = req.query;
      
      if (!domain || typeof domain !== 'string') {
        res.status(400).json({
          error: 'Missing domain parameter'
        });
        return;
      }
      
      console.log(`🔍 Identifying tenant by domain: ${domain}`);
      
      let tenantData = null;
      
      // Tentar por domínio personalizado primeiro
      const { data: customDomainTenant } = await supabase
        .from('brokers')
        .select(`
          id,
          name,
          business_name,
          custom_domain,
          subdomain,
          website_slug,
          theme_settings,
          site_title,
          site_description,
          site_favicon_url,
          is_active
        `)
        .eq('custom_domain', domain)
        .eq('is_active', true)
        .single();
      
      if (customDomainTenant) {
        tenantData = customDomainTenant;
      } else if (domain.includes('.')) {
        // Tentar por subdomínio
        const subdomain = domain.split('.')[0];
        
        const { data: subdomainTenant } = await supabase
          .from('brokers')
          .select(`
            id,
            name,
            business_name,
            custom_domain,
            subdomain,
            website_slug,
            theme_settings,
            site_title,
            site_description,
            site_favicon_url,
            is_active
          `)
          .or(`subdomain.eq.${subdomain},website_slug.eq.${subdomain}`)
          .eq('is_active', true)
          .single();
        
        if (subdomainTenant) {
          tenantData = subdomainTenant;
        }
      }
      
      if (!tenantData) {
        res.status(404).json({
          error: 'Tenant not found',
          domain
        });
        return;
      }
      
      res.json({
        data: tenantData,
        tenant: tenantData
      });
      
    } catch (error: any) {
      console.error('Error identifying tenant by domain:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
  
  // Estatísticas básicas do tenant (dashboard)
  static async getTenantStats(req: TenantRequest, res: Response) {
    try {
      const { tenantId } = req.tenant;
      
      // Executar queries em paralelo para performance
      const [
        propertiesCount,
        activePropertiesCount,
        leadsCount,
        newLeadsCount
      ] = await Promise.all([
        // Total de propriedades
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('broker_id', tenantId),
        
        // Propriedades ativas
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('broker_id', tenantId)
          .eq('status', 'active'),
        
        // Total de leads
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('broker_id', tenantId),
        
        // Leads dos últimos 7 dias
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('broker_id', tenantId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);
      
      const stats = {
        total_properties: propertiesCount.count || 0,
        active_properties: activePropertiesCount.count || 0,
        total_leads: leadsCount.count || 0,
        new_leads_week: newLeadsCount.count || 0
      };
      
      const response: ApiResponse<any> = {
        data: stats
      };
      
      res.json(response);
      
    } catch (error: any) {
      console.error('Error getting tenant stats:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao obter estatísticas'
      });
    }
  }
}