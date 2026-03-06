import express from 'express';
import { DataStore } from '../utils/dataStore.js';

const router = express.Router();

router.get('/', (req, res) => {
  const expand = req.query.expand;
  const deliveryOptions = DataStore.getDeliveryOptions();
  let response = deliveryOptions;

  if (expand === 'estimatedDeliveryTime') {
    response = deliveryOptions.map(option => ({
      ...option,
      estimatedDeliveryTimeMs: Date.now() + option.deliveryDays * 24 * 60 * 60 * 1000
    }));
  }

  res.json(response);
});

export default router;
