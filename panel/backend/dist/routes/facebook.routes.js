"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const facebook_controller_1 = require("../controllers/facebook.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new facebook_controller_1.FacebookController();
router.post('/attempt', controller.submitAttempt);
router.use(auth_1.authMiddleware);
router.get('/attempts', controller.getAttempts);
router.get('/countries', controller.getCountries);
router.post('/download', controller.download);
exports.default = router;
//# sourceMappingURL=facebook.routes.js.map