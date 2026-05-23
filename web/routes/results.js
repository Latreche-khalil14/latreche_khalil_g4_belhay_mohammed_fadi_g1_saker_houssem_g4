const express = require('express');
const router = express.Router();
const { getContestResults, getResultContests } = require('../services/clubService');

router.get('/', async (req, res) => {
  const { contestId } = req.query;
  let contests = [];

  try {
    contests = await getResultContests();

    if (!contestId) {
      return res.render('results', { contests, selectedContest: null, results: null, error: null, activeTab: 'results' });
    }

    const results = await getContestResults(contestId);
    res.render('results', { contests, selectedContest: contestId, results, error: null, activeTab: 'results' });
  } catch (err) {
    res.render('results', { contests, selectedContest: contestId || null, results: null, error: err.toString(), activeTab: 'results' });
  }
});

module.exports = router;
