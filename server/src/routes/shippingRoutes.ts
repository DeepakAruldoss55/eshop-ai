import { Router } from 'express';
import {
  getShippingRecords,
  getShippingMethods,
  trackShipment,
  updateShippingCheckpoint
} from '../controllers/shippingController.js';

const router = Router();

router.get('/', getShippingRecords);
router.get('/methods', getShippingMethods);
router.get('/track/:trackingNumber', trackShipment);
router.post('/:id/update', updateShippingCheckpoint);

export default router;
