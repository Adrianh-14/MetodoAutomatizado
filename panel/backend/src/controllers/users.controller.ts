import { Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();
const MANAGEABLE_ROLES = new Set(['admin', 'user']);

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isValidPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

function publicUserSelect(): Prisma.UserSelect {
  return {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    tenant: { select: { id: true, name: true, slug: true } },
  };
}

export class UsersController {
  async getTenants(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const where = req.user.role === 'superadmin'
        ? { isActive: true }
        : { id: req.user.tenantId, isActive: true };

      const tenants = await prisma.tenant.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
      });

      res.json(tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ error: 'Failed to fetch tenants' });
    }
  }

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const requestedTenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
      const where: Prisma.UserWhereInput = req.user.role === 'superadmin'
        ? {
            role: { not: 'superadmin' },
            ...(requestedTenantId ? { tenantId: requestedTenantId } : {}),
          }
        : { tenantId: req.user.tenantId, role: { not: 'superadmin' } };

      const users = await prisma.user.findMany({
        where,
        select: publicUserSelect(),
        orderBy: [{ tenant: { name: 'asc' } }, { createdAt: 'desc' }],
      });

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const email = normalizeEmail(req.body.email);
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      const password = req.body.password;
      const requestedRole = typeof req.body.role === 'string' ? req.body.role : 'user';

      if (!isValidEmail(email) || !name || !isValidPassword(password)) {
        res.status(400).json({
          error: 'Name, a valid email, and a password between 8 and 128 characters are required',
        });
        return;
      }

      if (!MANAGEABLE_ROLES.has(requestedRole)) {
        res.status(400).json({ error: 'Role must be admin or user' });
        return;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      let tenantId = req.user.tenantId;
      const targetTenantId = typeof req.body.tenantId === 'string' ? req.body.tenantId.trim() : '';
      const tenantName = typeof req.body.tenantName === 'string' ? req.body.tenantName.trim() : '';

      if (req.user.role === 'superadmin') {
        if (tenantName) {
          const slug = normalizeSlug(tenantName);
          if (!slug) {
            res.status(400).json({ error: 'Tenant name is invalid' });
            return;
          }

          const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
          if (existingTenant) {
            res.status(409).json({ error: 'A tenant with this name already exists; select it from the list' });
            return;
          }

          const passwordHash = await hashPassword(password);
          const newUser = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
              data: { name: tenantName, slug, isActive: true },
            });

            return tx.user.create({
              data: {
                tenantId: tenant.id,
                email,
                name,
                passwordHash,
                role: 'admin',
                isActive: true,
              },
              select: publicUserSelect(),
            });
          });

          res.status(201).json(newUser);
          return;
        }

        if (!targetTenantId) {
          res.status(400).json({ error: 'Select an existing tenant or enter a new tenant name' });
          return;
        }

        const targetTenant = await prisma.tenant.findFirst({
          where: { id: targetTenantId, isActive: true },
          select: { id: true },
        });
        if (!targetTenant) {
          res.status(404).json({ error: 'Tenant not found or inactive' });
          return;
        }
        tenantId = targetTenant.id;
      }

      if (req.user.role === 'admin' && targetTenantId && targetTenantId !== req.user.tenantId) {
        res.status(403).json({ error: 'Admins can only add users to their own tenant' });
        return;
      }

      const newUser = await prisma.user.create({
        data: {
          tenantId,
          email,
          name,
          passwordHash: await hashPassword(password),
          role: requestedRole,
          isActive: true,
        },
        select: publicUserSelect(),
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const where: Prisma.UserWhereInput = req.user.role === 'superadmin'
        ? { id, role: { not: 'superadmin' } }
        : { id, tenantId: req.user.tenantId, role: { not: 'superadmin' } };
      const user = await prisma.user.findFirst({ where });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updateData: Prisma.UserUpdateInput = {};
      if (typeof req.body.name === 'string' && req.body.name.trim()) {
        updateData.name = req.body.name.trim();
      }

      const email = normalizeEmail(req.body.email);
      if (email && email !== user.email) {
        if (!isValidEmail(email)) {
          res.status(400).json({ error: 'Email is invalid' });
          return;
        }
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
          res.status(409).json({ error: 'Email already in use' });
          return;
        }
        updateData.email = email;
      }

      if (req.body.password !== undefined) {
        if (!isValidPassword(req.body.password)) {
          res.status(400).json({ error: 'Password must contain between 8 and 128 characters' });
          return;
        }
        updateData.passwordHash = await hashPassword(req.body.password);
      }

      if (req.body.role !== undefined) {
        if (!MANAGEABLE_ROLES.has(req.body.role)) {
          res.status(400).json({ error: 'Role must be admin or user' });
          return;
        }

        if (id === req.user.userId && req.body.role !== user.role) {
          res.status(400).json({ error: 'You cannot change your own role' });
          return;
        }
        updateData.role = req.body.role;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: 'No valid fields provided for update' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: publicUserSelect(),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async toggleBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      if (id === req.user.userId) {
        res.status(400).json({ error: 'You cannot block your own account' });
        return;
      }

      const where: Prisma.UserWhereInput = req.user.role === 'superadmin'
        ? { id, role: { not: 'superadmin' } }
        : { id, tenantId: req.user.tenantId, role: { not: 'superadmin' } };
      const user = await prisma.user.findFirst({ where });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: publicUserSelect(),
      });
      res.json(updatedUser);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      res.status(500).json({ error: 'Failed to toggle block status' });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      if (id === req.user.userId) {
        res.status(400).json({ error: 'You cannot delete your own account' });
        return;
      }

      const where: Prisma.UserWhereInput = req.user.role === 'superadmin'
        ? { id, role: { not: 'superadmin' } }
        : { id, tenantId: req.user.tenantId, role: { not: 'superadmin' } };
      const user = await prisma.user.findFirst({ where });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.cookie.updateMany({ where: { downloadedBy: id }, data: { downloadedBy: null } });
        await tx.downloadLog.deleteMany({ where: { userId: id } });
        await tx.form.deleteMany({ where: { createdById: id } });
        await tx.user.delete({ where: { id } });
      });

      res.json({ success: true, message: 'User successfully deleted' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}
