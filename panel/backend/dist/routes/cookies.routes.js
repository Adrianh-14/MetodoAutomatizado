"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cookies_controller_1 = require("../controllers/cookies.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new cookies_controller_1.CookiesController();
router.use(auth_1.authMiddleware);
router.get('/', (req, res) => controller.list(req, res));
router.post('/', (req, res) => controller.upload(req, res));
router.post('/download', (req, res) => controller.download(req, res));
router.get('/countries', (req, res) => controller.getCountries(req, res));
exports.default = router;
//# sourceMappingURL=cookies.routes.js.map