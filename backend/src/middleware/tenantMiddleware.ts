import { Request, Response, NextFunction } from 'express';
import { identifyTenant } from './tenantIdentifier';

/**
 * Adapter middleware: reutiliza a implementação baseada em Supabase
 * já existente em `identifyTenant` para manter compatibilidade.
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  return identifyTenant(req, res, next);
}

export default resolveTenant;
