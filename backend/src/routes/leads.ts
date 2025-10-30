import { Router } from 'express';
import express from 'express';
import { LeadsController } from '../controllers/leadsController';

const router = Router();

// Rotas públicas de leads
router.post('/', LeadsController.createLead as unknown as express.RequestHandler);

export { router as leadsPublicRouter };