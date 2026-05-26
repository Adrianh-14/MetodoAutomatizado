import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router: Router = Router();
const usersController = new UsersController();

// All user routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.patch('/:id/block', usersController.toggleBlock);
router.delete('/:id', usersController.deleteUser);

export default router;
