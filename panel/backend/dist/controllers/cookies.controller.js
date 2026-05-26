"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookiesController = void 0;
const cookies_service_1 = require("../services/cookies.service");
const cookiesService = new cookies_service_1.CookiesService();
class CookiesController {
    async list(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const country = req.query.country;
            const status = req.query.status;
            const search = req.query.search;
            const result = await cookiesService.list(req.user.tenantId, page, limit, {
                country,
                status,
                search,
            }, req.user.role, req.user.userId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to list cookies' });
        }
    }
    async upload(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { cookies, countryCode, countryName } = req.body;
            if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
                res.status(400).json({ error: 'Cookies array is required' });
                return;
            }
            if (!countryCode || !countryName) {
                res.status(400).json({ error: 'Country code and name are required' });
                return;
            }
            const result = await cookiesService.upload(req.user.tenantId, cookies, countryCode, countryName);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to upload cookies' });
        }
    }
    async download(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const { quantity, countryCode } = req.body;
            if (!quantity || typeof quantity !== 'number' || quantity < 1) {
                res.status(400).json({ error: 'Valid quantity is required (minimum 1)' });
                return;
            }
            if (quantity > 10000) {
                res.status(400).json({ error: 'Maximum 10,000 cookies per download' });
                return;
            }
            const result = await cookiesService.download(req.user.tenantId, req.user.userId, quantity, countryCode);
            res.json(result);
        }
        catch (error) {
            if (error.message === 'No cookies available for download') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to download cookies' });
            }
        }
    }
    async getCountries(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }
            const countries = await cookiesService.getCountries(req.user.tenantId);
            res.json(countries);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get countries' });
        }
    }
}
exports.CookiesController = CookiesController;
//# sourceMappingURL=cookies.controller.js.map