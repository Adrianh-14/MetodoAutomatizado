import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const controller = new DashboardController();

router.use(authMiddleware);

router.get('/stats', (req, res) => controller.getStats(req, res));
router.get('/countries', (req, res) => controller.getCountries(req, res));
router.get('/activity', (req, res) => controller.getRecentActivity(req, res));

export default router;
