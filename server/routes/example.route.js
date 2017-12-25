import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import exampleCtrl from '../controllers/example.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/example - Get example */
  .get(exampleCtrl.example1)

  /** POST /api/example - Post example */
  .post(validate(paramValidation.example2), exampleCtrl.example2);

export default router;
