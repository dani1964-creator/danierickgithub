import { Router } from 'express';
import { LeadsController } from '../controllers/leadsController';

const router = Router();

// Rotas públicas de leads
router.post('/', LeadsController.createLead as any);

export { router as leadsPublicRouter };