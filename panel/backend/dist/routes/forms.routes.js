"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forms_controller_1 = require("../controllers/forms.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const formsController = new forms_controller_1.FormsController();
// Public route for submissions (embedded forms on external hosting)
router.post('/:id/submit', formsController.submitForm);
// Private dashboard routes
router.use(auth_1.authMiddleware);
router.post('/', formsController.createForm);
router.get('/', formsController.getForms);
router.get('/:id/responses', formsController.getResponses);
exports.default = router;
//# sourceMappingURL=forms.routes.js.map