const express = require('express');
const router = express.Router();
const Project = require('../models/project');

router.post('/', (req, res, next) => {
  const accountId = req.session.accountId;
  const {name} = req.body;

  const project = new Project({
    accountId,
    name,
  });

  project.save((err) => {
    if(err) throw err;
  });

  res.redirect('/');
})

module.exports = router;