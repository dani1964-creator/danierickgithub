import { Router } from 'express';
import express from 'express';
import { TenantController } from '../controllers/tenantController';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../lib/logger';

const router = Router();

// Rotas de tenant
router.get('/info', TenantController.getTenantInfo as unknown as express.RequestHandler);
router.get('/identify', TenantController.identifyByDomain as unknown as express.RequestHandler);
router.get('/stats', TenantController.getTenantStats as unknown as express.RequestHandler);

// Atualizar slug / domínio do broker (usuário autenticado)
router.put('/update', authMiddleware as unknown as express.RequestHandler, TenantController.updateSettings as unknown as express.RequestHandler);

// Rota de teste para atualizar broker diretamente por broker_id (APENAS em development)
router.post('/test-update', async (req, res) => {
	try {
		if (process.env.NODE_ENV !== 'development') {
			return res.status(403).json({ error: 'Forbidden' });
		}

		const { broker_id, website_slug, custom_domain } = req.body as { broker_id?: string; website_slug?: string; custom_domain?: string };

		if (!broker_id) {
			return res.status(400).json({ error: 'Missing broker_id in body' });
		}

		// Basic slug validation
		if (website_slug && !/^[a-z0-9-]{1,50}$/.test(website_slug)) {
			return res.status(400).json({ error: 'Invalid slug format' });
		}

		// Check uniqueness for slug and domain
		const supabaseAdminClient = (await import('@supabase/supabase-js')).createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '');
		const { data: existingSlug } = await supabaseAdminClient.from('brokers').select('id').eq('website_slug', website_slug || '').maybeSingle();
		if (existingSlug && existingSlug.id !== broker_id) {
			return res.status(409).json({ error: 'Slug already in use' });
		}

		const domainNormalized = custom_domain ? (custom_domain as string).replace(/https?:\/\//, '').replace(/\/$/, '') : null;
		if (domainNormalized) {
			const { data: existingDomain } = await supabaseAdminClient.from('brokers').select('id').eq('custom_domain', domainNormalized).maybeSingle();
			if (existingDomain && existingDomain.id !== broker_id) {
				return res.status(409).json({ error: 'Custom domain already in use' });
			}
		}

	const updatePayload: Record<string, unknown> = {};
	if (website_slug !== undefined) (updatePayload as Record<string, unknown>)['website_slug'] = website_slug;
	if (custom_domain !== undefined) (updatePayload as Record<string, unknown>)['custom_domain'] = domainNormalized;

		const supabase = (await import('../config/supabase')).supabase;
		const { error: updateErr } = await supabase.from('brokers').update(updatePayload).eq('id', broker_id);
		if (updateErr) {
			return res.status(500).json({ error: 'Update failed', details: updateErr.message });
		}

		return res.json({ success: true, message: 'Test update applied' });
	} catch (err: unknown) {
		logger.error('Test update error:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

export { router as tenantRouter };