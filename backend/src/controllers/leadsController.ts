import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TenantRequest, ApiResponse } from '../types/tenant';
import { logger } from '../lib/logger';

export class LeadsController {
  
  // Criar lead (formulário público)
  static async createLead(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, tenant } = req.tenant;
      const {
        name,
        email,
        phone,
        message,
        property_id,
        lead_source = 'website'
      } = req.body;
      
      // Validações básicas
      if (!name || !email || !phone) {
        res.status(400).json({
          error: 'Missing required fields',
          message: 'Nome, email e telefone são obrigatórios'
        });
        return;
      }
      
  logger.info(`📝 Creating lead for ${tenant.business_name}: ${name}`);
      
      // Rate limiting básico - verificar se já existe lead recente do mesmo email
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentLead } = await supabase
        .from('leads')
        .select('id')
        .eq('broker_id', tenantId)
        .eq('email', email)
        .gte('created_at', oneHourAgo)
        .single();
      
      if (recentLead) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Aguarde 1 hora antes de enviar outro contato'
        });
        return;
      }
      
      // Criar lead
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          broker_id: tenantId,
          property_id,
          name,
          email,
          phone,
          message,
          lead_source,
          status: 'new',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
  if (error) throw error;

  logger.info(`✅ Lead created: ${lead.id} for ${name}`);
      
      // Incrementar contador na propriedade se especificada
      if (property_id) {
        await supabase
          .rpc('increment_property_leads', { property_id });
      }
      
      const response: ApiResponse<unknown> = {
        data: lead,
        message: 'Lead criado com sucesso! Entraremos em contato em breve.'
      };
      
      res.status(201).json(response);
      
    } catch (error: unknown) {
      logger.error('Error creating lead:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao criar contato'
      });
    }
  }
  
  // Listar leads para admin
  static async getAdminLeads(req: TenantRequest, res: Response) {
    try {
      const { tenantId } = req.tenant;
      const {
        page = 1,
        limit = 20,
        status,
        source,
        property_id
      } = req.query;
      
      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          phone,
          message,
          lead_source,
          status,
          property_id,
          created_at,
          updated_at,
          properties (
            title,
            property_code
          )
        `, { count: 'exact' })
        .eq('broker_id', tenantId)
        .order('created_at', { ascending: false });
      
      // Aplicar filtros
      if (status) query = query.eq('status', status);
      if (source) query = query.eq('lead_source', source);
      if (property_id) query = query.eq('property_id', property_id);
      
      // Paginação
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const offset = (pageNum - 1) * limitNum;
      
      query = query.range(offset, offset + limitNum - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;

      const response: ApiResponse<unknown[]> = {
        data: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          hasMore: (data?.length || 0) === limitNum
        }
      };
      
      res.json(response);
      
    } catch (error: unknown) {
      logger.error('Error loading admin leads:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Erro ao carregar leads'
      });
    }
  }
}