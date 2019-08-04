const express = require('express');
const router = express.Router();
const Project = require('../models/project');

/* GET home page. */
router.get('/', async (req, res, next) => {
  if(!req.session.isLogined) return res.redirect('/auth/signin');

  const nickname = req.session.nickname;
  const accountId = req.session.accountId;
  const projects = await Project.find({
    accountId,
  }).then();

  res.render('index', {
    nickname, 
    projects,
  });
});

module.exports = router;
