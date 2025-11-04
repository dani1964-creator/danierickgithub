import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../lib/logger';

const router = Router();

router.get('/tenants', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brokers')
      .select('id, name, slug, subdomain, is_active')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching tenants for debug route:', error);
      return res.status(500).json({ error: 'Erro ao listar tenants' });
    }

    return res.json(data || []);
  } catch (err) {
    logger.error('Erro debug tenants:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
