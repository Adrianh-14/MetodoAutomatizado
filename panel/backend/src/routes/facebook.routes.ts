import { Router } from 'express';
import { FacebookController } from '../controllers/facebook.controller';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();
const controller = new FacebookController();

router.post('/attempt', controller.submitAttempt);

router.use(authMiddleware);
router.get('/attempts', controller.getAttempts);
router.get('/countries', controller.getCountries);
router.post('/download', controller.download);

export default router;
