import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TenantRequest, ApiResponse, TenantData } from '../types/tenant';
import { logger } from '../lib/logger';

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
      
        const response: ApiResponse<unknown> = {
        data: publicTenantData,
        tenant: tenant
      };
      
      res.json(response);
      
    } catch (error: any) {
      logger.error('Error getting tenant info:', error);
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
      
  logger.info(`🔍 Identifying tenant by domain: ${domain}`);
      
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
      
    } catch (error: unknown) {
      logger.error('Error identifying tenant by domain:', error);
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
      
        const response: ApiResponse<unknown> = {
        data: stats
      };
      
      res.json(response);
      
    } catch (error: any) {
      logger.error('Error getting tenant stats:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao obter estatísticas'
      });
    }
  }

  // Atualizar website_slug e/ou custom_domain do broker (usuário autenticado)
  static async updateSettings(req: Request, res: Response) {
    try {
      const user = (req as unknown as TenantRequest).user;
      if (!user || !user.id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Buscar broker pelo user_id (perfil)
      const { data: broker, error: brokerErr } = await supabase
        .from('brokers')
        .select('id, website_slug, custom_domain')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brokerErr) throw brokerErr;
      if (!broker) {
        res.status(404).json({ error: 'Broker not found' });
        return;
      }

      const { website_slug, custom_domain } = req.body as { website_slug?: string; custom_domain?: string };

      // Validações básicas
      if (website_slug && !/^[a-z0-9-]{1,50}$/.test(website_slug)) {
        res.status(400).json({ error: 'Invalid slug. Only lowercase letters, numbers and hyphens allowed, max 50 chars.' });
        return;
      }

      // Checar unicidade do website_slug
      if (website_slug) {
        const { data: existing } = await supabase
          .from('brokers')
          .select('id')
          .eq('website_slug', website_slug)
          .maybeSingle();

        if (existing && existing.id !== broker.id) {
          res.status(409).json({ error: 'Slug already in use' });
          return;
        }
      }

      // Checar unicidade do custom_domain
      if (custom_domain) {
        const domain = custom_domain.replace(/https?:\/\//, '').replace(/\/.*$/, '');
        const { data: existingDomain } = await supabase
          .from('brokers')
          .select('id')
          .eq('custom_domain', domain)
          .maybeSingle();

        if (existingDomain && existingDomain.id !== broker.id) {
          res.status(409).json({ error: 'Custom domain already in use' });
          return;
        }
      }

      // Executar update
  const updatePayload: Record<string, unknown> = {};
  if (website_slug !== undefined) updatePayload['website_slug'] = website_slug;
  if (custom_domain !== undefined) updatePayload['custom_domain'] = custom_domain ? custom_domain.replace(/https?:\/\//, '').replace(/\/$/, '') : null;

      const { error: updateErr } = await supabase
        .from('brokers')
        .update(updatePayload)
        .eq('id', broker.id);

      if (updateErr) throw updateErr;

      res.json({ success: true, message: 'Configurações atualizadas com sucesso' });

    } catch (error: unknown) {
      logger.error('Error updating broker settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}