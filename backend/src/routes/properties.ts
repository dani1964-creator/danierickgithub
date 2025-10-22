import { Router } from 'express';
import { PropertiesController } from '../controllers/propertiesController';

const router = Router();

// Rotas públicas de propriedades (site público do tenant)
router.get('/', PropertiesController.getPublicProperties as any);
router.get('/:propertyId', PropertiesController.getPublicProperty as any);

export { router as propertiesPublicRouter };