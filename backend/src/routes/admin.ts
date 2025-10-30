import { Router } from 'express';
import express from 'express';
import { PropertiesController } from '../controllers/propertiesController';
import { LeadsController } from '../controllers/leadsController';

const router = Router();

// Rotas administrativas de propriedades
router.get('/properties', PropertiesController.getAdminProperties as unknown as express.RequestHandler);

// Rotas administrativas de leads
router.get('/leads', LeadsController.getAdminLeads as unknown as express.RequestHandler);

export { router as adminRouter };