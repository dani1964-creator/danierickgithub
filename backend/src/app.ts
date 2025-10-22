import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Middlewares
import { identifyTenant } from './middleware/tenantIdentifier';
import { authMiddleware } from './middleware/auth';

// Routes
import { propertiesPublicRouter } from './routes/properties';
import { leadsPublicRouter } from './routes/leads';
import { tenantRouter } from './routes/tenant';
import { adminRouter } from './routes/admin';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares de segurança e performance
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));

// CORS configurado para multi-tenant
app.use(cors({
  origin: (origin, callback) => {
    // Em produção, permitir qualquer origem para domínios personalizados
    // Em desenvolvimento, permitir localhost
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-domain']
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (sem middleware de tenant)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas de identificação de tenant (sem middleware de autenticação)
app.use('/api/tenant', tenantRouter);

// Rotas públicas (com identificação de tenant)
app.use('/api/public/properties', identifyTenant, propertiesPublicRouter);
app.use('/api/public/leads', identifyTenant, leadsPublicRouter);

// Rotas administrativas (com autenticação e identificação de tenant)
app.use('/api/admin', authMiddleware, identifyTenant, adminRouter);

// Middleware de erro global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend multi-tenant rodando na porta ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;