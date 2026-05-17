import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

export class UsersController {
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const role = req.user?.role;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const whereClause: any = role === 'superadmin' ? {} : { tenantId, role: { not: 'superadmin' } };

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          tenant: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUserRole = req.user?.role;
      const currentUserTenantId = req.user?.tenantId;
      
      if (!currentUserRole || !currentUserTenantId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { email, password, name, role, tenantName } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, password, and name are required' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        res.status(400).json({ error: 'User with this email already exists' });
        return;
      }

      const passwordHash = await hashPassword(password);
      
      let newTenantId = currentUserTenantId;
      let newUserRole = role === 'admin' ? 'admin' : 'user';

      if (currentUserRole === 'superadmin' && tenantName) {
        // Create new tenant
        let slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        if (!slug) slug = `tenant-${Date.now()}`;
        
        let targetTenant = await prisma.tenant.findUnique({ where: { slug } });
        if (!targetTenant) {
          targetTenant = await prisma.tenant.create({
            data: {
              name: tenantName,
              slug,
              isActive: true
            }
          });
        }
        newTenantId = targetTenant.id;
        newUserRole = 'admin'; // Always admin for new company
      }

      if (currentUserRole === 'admin' && role === 'superadmin') {
         res.status(403).json({ error: 'Cannot create superadmin' });
         return;
      }

      const newUser = await prisma.user.create({
        data: {
          tenantId: newTenantId,
          email: normalizedEmail,
          name,
          passwordHash,
          role: newUserRole,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          tenant: { select: { name: true } }
        }
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const currentUserRole = req.user?.role;
      if (!tenantId || !currentUserRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { name, password, email } = req.body;

      const whereClause: any = currentUserRole === 'superadmin' ? { id } : { id, tenantId, role: { not: 'superadmin' } };
      const user = await prisma.user.findFirst({
        where: whereClause
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email.trim().toLowerCase();
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: 'No valid fields provided for update' });
        return;
      }

      // If email is being updated, check if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: updateData.email }
        });
        if (existingEmail) {
          res.status(400).json({ error: 'Email already in use' });
          return;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          updatedAt: true,
        }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async toggleBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const adminId = req.user?.userId;
      const currentUserRole = req.user?.role;
      
      if (!tenantId || !currentUserRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Prevent admin from blocking themselves
      if (id === adminId) {
        res.status(400).json({ error: 'You cannot block your own account' });
        return;
      }

      const whereClause: any = currentUserRole === 'superadmin' ? { id } : { id, tenantId, role: { not: 'superadmin' } };
      const user = await prisma.user.findFirst({
        where: whereClause
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      res.status(500).json({ error: 'Failed to toggle block status' });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const adminId = req.user?.userId;
      const currentUserRole = req.user?.role;

      if (!tenantId || !currentUserRole) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === adminId) {
        res.status(400).json({ error: 'You cannot delete your own account' });
        return;
      }

      const whereClause: any = currentUserRole === 'superadmin' ? { id } : { id, tenantId, role: { not: 'superadmin' } };
      const user = await prisma.user.findFirst({
        where: whereClause
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Execute deletion within a transaction
      await prisma.$transaction(async (tx) => {
        // 1. Set downloadedBy to null in Cookies
        await tx.cookie.updateMany({
          where: { downloadedBy: id },
          data: { downloadedBy: null }
        });

        // 2. Delete DownloadLogs
        await tx.downloadLog.deleteMany({
          where: { userId: id }
        });

        // 3. Delete the user
        await tx.user.delete({
          where: { id }
        });
      });

      res.json({ success: true, message: 'User successfully deleted' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}
