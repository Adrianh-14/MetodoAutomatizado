import { Router } from 'express';

const router: Router = Router();

router.all('/api/v1/*', (_req, res) => {
  res.status(503).json({
    success: false,
    error: 'El servicio de automatización (MOSIVO AUTO) no está disponible en producción. Debe ejecutarse localmente con Playwright.',
  });
});

export default router;
