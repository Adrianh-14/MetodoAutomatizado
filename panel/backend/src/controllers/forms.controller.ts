import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export class FormsController {
  // 1. Create a new form
  async createForm(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;
      
      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { title } = req.body;
      if (!title || !title.trim()) {
        res.status(400).json({ error: 'El título es obligatorio' });
        return;
      }

      const form = await prisma.form.create({
        data: {
          title: title.trim(),
          tenantId,
          createdById: userId
        }
      });

      res.status(201).json(form);
    } catch (error) {
      console.error('Error al crear formulario:', error);
      res.status(500).json({ error: 'Error al crear formulario' });
    }
  }

  // 2. Get forms of the current tenant
  async getForms(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const role = req.user?.role;
      const userId = req.user?.userId;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // If user is admin/superadmin, get all forms in the tenant.
      // If user is standard user, only get forms created by them.
      const whereClause = (role === 'admin' || role === 'superadmin')
        ? { tenantId }
        : { tenantId, createdById: userId };

      const forms = await prisma.form.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: { name: true, email: true }
          },
          _count: {
            select: { responses: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(forms);
    } catch (error) {
      console.error('Error al obtener formularios:', error);
      res.status(500).json({ error: 'Error al obtener formularios' });
    }
  }

  // 3. Get responses of a specific form
  async getResponses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const role = req.user?.role;
      const userId = req.user?.userId;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Verify the form belongs to the current tenant
      const form = await prisma.form.findFirst({
        where: { id, tenantId }
      });

      if (!form) {
        res.status(404).json({ error: 'Formulario no encontrado' });
        return;
      }

      // Standard user can only see responses of their own forms
      if (role !== 'admin' && role !== 'superadmin' && form.createdById !== userId) {
        res.status(403).json({ error: 'Acceso denegado' });
        return;
      }

      const responses = await prisma.formResponse.findMany({
        where: { formId: id },
        orderBy: { createdAt: 'desc' }
      });

      res.json(responses);
    } catch (error) {
      console.error('Error al obtener respuestas:', error);
      res.status(500).json({ error: 'Error al obtener respuestas' });
    }
  }

  // 4. Public endpoint to submit form response (CORS dynamic, no auth)
  async submitForm(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, shortText } = req.body;

      if (!email || !shortText) {
        res.status(400).json({ error: 'Correo y texto son obligatorios' });
        return;
      }

      // Check if form exists and is active
      const form = await prisma.form.findUnique({
        where: { id }
      });

      if (!form) {
        res.status(404).json({ error: 'Formulario no válido o no existe' });
        return;
      }

      const response = await prisma.formResponse.create({
        data: {
          formId: id,
          email: email.trim().toLowerCase(),
          shortText: shortText.trim()
        }
      });

      res.status(201).json({ success: true, message: 'Respuesta guardada', id: response.id });
    } catch (error) {
      console.error('Error al procesar envío de formulario:', error);
      res.status(500).json({ error: 'Error interno al procesar el envío' });
    }
  }
}
