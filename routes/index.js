const express = require('express');

const router = express.Router();
const Project = require('../models/project');

/* GET home page. */
router.get('/', async (req, res) => {
  if (!req.session.isLogined) {
    res.redirect('/auth/signin');
    return;
  }

  const { nickname } = req.session;
  const { accountId } = req.session;
  const projects = await Project.find({
    accountId,
  }).then();

  res.render('index', {
    nickname,
    projects,
  });
});

module.exports = router;
