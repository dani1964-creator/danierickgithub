import { Router } from 'express';
import express from 'express';
import { PropertiesController } from '../controllers/propertiesController';

const router = Router();

// Rotas públicas de propriedades (site público do tenant)
router.get('/', PropertiesController.getPublicProperties as unknown as express.RequestHandler);
router.get('/:propertyId', PropertiesController.getPublicProperty as unknown as express.RequestHandler);

export { router as propertiesPublicRouter };