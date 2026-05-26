"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const dashboardService = new dashboard_service_1.DashboardService();
class DashboardController {
    async getStats(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const stats = await dashboardService.getStats(req.user.tenantId, req.user.role, req.user.userId);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get dashboard stats' });
        }
    }
    async getCountries(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const countries = await dashboardService.getCountryStats(req.user.tenantId, req.user.role, req.user.userId);
            res.json(countries);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get country stats' });
        }
    }
    async getRecentActivity(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const limit = parseInt(req.query.limit) || 10;
            const activity = await dashboardService.getRecentActivity(req.user.tenantId, limit, req.user.role, req.user.userId);
            res.json(activity);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get recent activity' });
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map