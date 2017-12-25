import express from 'express';
import exampleRoutes from './example.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount user routes at /example
router.use('/example', exampleRoutes);

export default router;
