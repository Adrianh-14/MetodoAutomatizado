import { Router } from 'express';
import { FormsController } from '../controllers/forms.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const formsController = new FormsController();

// Public route for submissions (embedded forms on external hosting)
router.post('/:id/submit', formsController.submitForm);

// Private dashboard routes
router.use(authMiddleware);
router.post('/', formsController.createForm);
router.get('/', formsController.getForms);
router.get('/:id/responses', formsController.getResponses);

export default router;
