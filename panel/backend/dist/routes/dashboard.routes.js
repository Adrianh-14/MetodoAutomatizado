"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new dashboard_controller_1.DashboardController();
router.use(auth_1.authMiddleware);
router.get('/stats', (req, res) => controller.getStats(req, res));
router.get('/countries', (req, res) => controller.getCountries(req, res));
router.get('/activity', (req, res) => controller.getRecentActivity(req, res));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map