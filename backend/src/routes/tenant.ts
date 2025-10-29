import { Router } from 'express';
import { TenantController } from '../controllers/tenantController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Rotas de tenant
router.get('/info', TenantController.getTenantInfo as any);
router.get('/identify', TenantController.identifyByDomain as any);
router.get('/stats', TenantController.getTenantStats as any);

// Atualizar slug / domínio do broker (usuário autenticado)
router.put('/update', authMiddleware as any, TenantController.updateSettings as any);

export { router as tenantRouter };