import { Router } from 'express';
import { TenantController } from '../controllers/tenantController';

const router = Router();

// Rotas de tenant
router.get('/info', TenantController.getTenantInfo as any);
router.get('/identify', TenantController.identifyByDomain as any);
router.get('/stats', TenantController.getTenantStats as any);

export { router as tenantRouter };