"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
router.post('/login', (req, res) => controller.login(req, res));
router.post('/refresh', (req, res) => controller.refresh(req, res));
router.get('/me', auth_1.authMiddleware, (req, res) => controller.getMe(req, res));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map