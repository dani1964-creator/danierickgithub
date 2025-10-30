import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { TenantContext, TenantData, TenantRequest } from '../types/tenant';
import { logger } from '../lib/logger';



export async function identifyTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    const hostname = host.split(':')[0];
    
  logger.info(`🔍 Identifying tenant for hostname: ${hostname}`);
    
    let tenantData: TenantData | null = null;
    let tenantContext: TenantContext | null = null;
    
    // 1. Primeiro, tentar identificar por domínio personalizado
    if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    logger.debug(`🌐 Checking custom domain: ${hostname}`);
      
      const { data: customDomainTenant, error: customError } = await supabase
        .from('brokers')
        .select(`
          id,
          name,
          business_name,
          email,
          custom_domain,
          subdomain,
          website_slug,
          theme_settings,
          site_title,
          site_description,
          site_favicon_url,
          is_active,
          plan_type,
          created_at,
          updated_at
        `)
        .eq('custom_domain', hostname)
        .eq('is_active', true)
        .single();
      
      if (!customError && customDomainTenant) {
        logger.info(`✅ Found tenant by custom domain: ${customDomainTenant.business_name}`);
        tenantData = customDomainTenant;
        tenantContext = {
          tenantId: customDomainTenant.id,
          domain: hostname,
          customDomain: hostname,
          tenant: customDomainTenant
        };
      }
    }
    
    // 2. Se não encontrou por domínio personalizado, tentar por subdomínio
    if (!tenantContext && hostname.includes('.')) {
      const subdomain = hostname.split('.')[0];
      
      // Ignorar subdomínios reservados
      if (!['www', 'api', 'admin', 'app', 'mail'].includes(subdomain)) {
    logger.debug(`🌐 Checking subdomain: ${subdomain}`);
        
        const { data: subdomainTenant, error: subError } = await supabase
          .from('brokers')
          .select(`
            id,
            name,
            business_name,
            email,
            custom_domain,
            subdomain,
            website_slug,
            theme_settings,
            site_title,
            site_description,
            site_favicon_url,
            is_active,
            plan_type,
            created_at,
            updated_at
          `)
          .or(`subdomain.eq.${subdomain},website_slug.eq.${subdomain}`)
          .eq('is_active', true)
          .single();
        
        if (!subError && subdomainTenant) {
          logger.info(`✅ Found tenant by subdomain: ${subdomainTenant.business_name}`);
          tenantData = subdomainTenant;
          tenantContext = {
            tenantId: subdomainTenant.id,
            domain: hostname,
            subdomain: subdomain,
            tenant: subdomainTenant
          };
        }
      }
    }
    
    // 3. Para desenvolvimento local, usar tenant padrão se especificado
    if (!tenantContext && (hostname.includes('localhost') || hostname.includes('127.0.0.1'))) {
      const defaultTenantId = process.env.DEFAULT_TENANT_ID;
      
      if (defaultTenantId) {
    logger.debug(`🏠 Using default tenant for local development: ${defaultTenantId}`);
        
        const { data: defaultTenant, error: defaultError } = await supabase
          .from('brokers')
          .select(`
            id,
            name,
            business_name,
            email,
            custom_domain,
            subdomain,
            website_slug,
            theme_settings,
            site_title,
            site_description,
            site_favicon_url,
            is_active,
            plan_type,
            created_at,
            updated_at
          `)
          .eq('id', defaultTenantId)
          .single();
        
        if (!defaultError && defaultTenant) {
          tenantData = defaultTenant;
          tenantContext = {
            tenantId: defaultTenant.id,
            domain: hostname,
            tenant: defaultTenant
          };
        }
      }
    }
    
    // 4. Se ainda não encontrou, retornar erro
      if (!tenantContext) {
        logger.warn(`❌ Tenant not found for hostname: ${hostname}`);
      res.status(404).json({
        error: 'Tenant not found',
        message: `Nenhuma imobiliária encontrada para o domínio: ${hostname}`,
        hostname
      });
      return;
    }
    
    // 5. Verificar se tenant está ativo
      if (!tenantContext.tenant.is_active) {
        logger.warn(`🚫 Tenant inactive: ${tenantContext.tenant.business_name}`);
      res.status(403).json({
        error: 'Tenant inactive',
        message: 'Esta imobiliária está temporariamente indisponível'
      });
      return;
    }
    
    // 6. Adicionar contexto do tenant à requisição
    (req as TenantRequest).tenant = tenantContext;
    
    logger.info(`✅ Tenant identified successfully: ${tenantContext.tenant.business_name} (${tenantContext.tenantId})`);
    
    next();
    
  } catch (error: unknown) {
    logger.error('❌ Tenant identification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno ao identificar imobiliária'
    });
    return;
  }
}

// Middleware opcional para rotas que podem funcionar sem tenant (ex: health check)
export async function optionalTenantIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    await identifyTenant(req, res, () => {
      // Se chegou aqui, tenant foi identificado com sucesso
      next();
    });
  } catch (error) {
    // If houver erro, continuar sem tenant
    logger.warn('⚠️ Optional tenant identification failed, continuing without tenant');
    next();
  }
}

// Middleware para garantir que o usuário pertence ao tenant atual
export function validateTenantAccess(req: TenantRequest, res: Response, next: NextFunction): void {
  const userBrokerId = req.user?.broker_id;
  const tenantId = req.tenant?.tenantId;
  
  if (!userBrokerId || !tenantId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Acesso negado: usuário ou tenant não identificado'
    });
    return;
  }
  
  if (userBrokerId !== tenantId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso negado: usuário não pertence a esta imobiliária'
    });
    return;
  }
  
  next();
}