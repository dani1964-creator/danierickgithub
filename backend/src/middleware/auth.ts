import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    broker_id?: string;
  };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de acesso necessário'
      });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token inválido ou expirado'
      });
      return;
    }
    
    // Buscar dados adicionais do usuário no profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, broker_id')
      .eq('id', user.id)
      .single();
    
    // Adicionar dados do usuário à requisição
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email!,
      role: profile?.role || 'user',
      broker_id: profile?.broker_id
    };
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno de autenticação'
    });
    return;
  }
}

// Middleware para verificar se o usuário tem a role necessária
export function requireRole(roles: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuário não autenticado'
      });
      return;
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Acesso negado: role necessária: ${allowedRoles.join(' ou ')}`
      });
      return;
    }
    
    next();
  };
}

// Middleware para super admin
export const requireSuperAdmin = requireRole('super_admin');

// Middleware para admin ou super admin
export const requireAdmin = requireRole(['admin', 'super_admin']);