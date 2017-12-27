import express from 'express';
import pairCtrl from '../controllers/pair.controller';

const router = express.Router();

router.route('/add')
  .post(pairCtrl.add);

router.route('/remove')
  .post(pairCtrl.remove);

export default router;
