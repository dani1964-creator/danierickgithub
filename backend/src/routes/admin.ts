import { Router } from 'express';
import { PropertiesController } from '../controllers/propertiesController';
import { LeadsController } from '../controllers/leadsController';

const router = Router();

// Rotas administrativas de propriedades
router.get('/properties', PropertiesController.getAdminProperties as any);

// Rotas administrativas de leads
router.get('/leads', LeadsController.getAdminLeads as any);

export { router as adminRouter };