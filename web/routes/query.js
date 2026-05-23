const express = require('express');
const router = express.Router();
const { executeRawQuery } = require('../services/basexService');

router.get('/', (req, res) => {
  res.render('query', { code: '', result: null, error: null, activeTab: 'query' });
});

router.post('/', async (req, res) => {
  const { code } = req.body;

  if (!code || code.trim() === '') {
    return res.render('query', { code: '', result: null, error: 'Veuillez saisir une requete XQuery.', activeTab: 'query' });
  }

  try {
    const result = await executeRawQuery(code);
    res.render('query', { code, result, error: null, activeTab: 'query' });
  } catch (err) {
    res.render('query', { code, result: null, error: err.toString(), activeTab: 'query' });
  }
});

module.exports = router;
