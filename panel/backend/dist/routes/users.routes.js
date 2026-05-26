"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const usersController = new users_controller_1.UsersController();
// All user routes require authentication and admin role
router.use(auth_1.authMiddleware);
router.use(auth_1.adminOnly);
router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.patch('/:id/block', usersController.toggleBlock);
router.delete('/:id', usersController.deleteUser);
exports.default = router;
//# sourceMappingURL=users.routes.js.map