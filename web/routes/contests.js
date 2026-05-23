const express = require('express');
const router = express.Router();
const { getDashboardContests } = require('../services/clubService');

router.get('/', async (req, res, next) => {
  try {
    const contests = await getDashboardContests();
    res.render('index', { title: 'Contests Dashboard', contests, activeTab: 'contests', error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
