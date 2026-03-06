import express from 'express';
import { DataStore } from '../utils/dataStore.js';

const router = express.Router();

router.post('/', (req, res) => {
  DataStore.resetData();
  res.status(204).send();
});

export default router;

