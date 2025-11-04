import { Request, Response, NextFunction } from 'express';
// Ajuste o import do Tenant conforme seu ORM (Sequelize/TypeORM/Prisma)
// Exemplo Sequelize: import { Tenant } from '../models/Tenant';
import { Tenant } from '../models/Tenant';

/**
 * Middleware para resolver tenant a partir do Host (subdomínio).
 * - Super admin: adminimobiliaria.site ou www.adminimobiliaria.site
 * - Tenant showcase: {subdomain}.adminimobiliaria.site
 * - Tenant painel: {subdomain}.painel.adminimobiliaria.site
 *
 * Observação: ajuste o campo/colunas usados na query conforme seu modelo.
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const host = (req.headers.host || '').toString();

  const isSuperAdmin = host === 'adminimobiliaria.site' || host === 'www.adminimobiliaria.site';
  const isTenantPanel = /\.painel\.adminimobiliaria\.site$/.test(host);
  const isTenantShowcase = /\.adminimobiliaria\.site$/.test(host) && !isSuperAdmin;

  if (isSuperAdmin) return next();

  let subdomain = '';
  if (isTenantPanel) {
    // exemplo: danierick.painel.adminimobiliaria.site -> danierick
    subdomain = host.split('.')[0];
  } else if (isTenantShowcase) {
    subdomain = host.split('.')[0];
  }

  if (!subdomain) return res.status(404).json({ error: 'Subdomínio não identificado' });

  try {
    const tenant = await Tenant.findOne({
      where: {
        subdomain,
        status: 'active'
      }
    });

    if (!tenant) {
      console.warn(`Tenant não encontrado: ${subdomain}`);
      return res.status(404).json({ error: 'Imobiliária não encontrada' });
    }

    // Anexa o tenant no request para uso posterior
    (req as any).tenant = tenant;
    return next();
  } catch (err) {
    console.error(`Erro ao resolver tenant ${subdomain}:`, err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export default resolveTenant;
