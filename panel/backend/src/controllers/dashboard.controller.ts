import { Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const stats = await dashboardService.getStats(req.user.tenantId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  }

  async getCountries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const countries = await dashboardService.getCountryStats(req.user.tenantId);
      res.json(countries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get country stats' });
    }
  }

  async getRecentActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await dashboardService.getRecentActivity(req.user.tenantId, limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get recent activity' });
    }
  }
}
