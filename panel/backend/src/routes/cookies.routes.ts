import { Router } from 'express';
import { CookiesController } from '../controllers/cookies.controller';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();
const controller = new CookiesController();

router.use(authMiddleware);

router.get('/', (req, res) => controller.list(req, res));
router.post('/', (req, res) => controller.upload(req, res));
router.post('/download', (req, res) => controller.download(req, res));
router.get('/countries', (req, res) => controller.getCountries(req, res));

export default router;
