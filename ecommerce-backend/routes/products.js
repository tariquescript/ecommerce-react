import express from 'express';
import { DataStore } from '../utils/dataStore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const search = req.query.search;

  let products = DataStore.getProducts();

  if (search) {
    const lowerCaseSearch = search.toLowerCase();
    products = products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowerCaseSearch);
      const keywordsMatch = product.keywords?.some(keyword => keyword.toLowerCase().includes(lowerCaseSearch));
      return nameMatch || keywordsMatch;
    });
  }

  res.json(products);
});

export default router;