const express = require('express');

const router = express.Router();
const Project = require('../models/project');

router.get('/:apiKey', async (req, res, next) => {
  const { apiKey } = req.params;
  const project = await Project.findOne({ apiKey });

  if (!project) {
    next();
    return;
  }

  req.session.projectId = project._id;

  res.send();
});

router.post('/', (req, res) => {
  const { accountId } = req.session;
  const { name } = req.body;

  const project = new Project({
    accountId,
    name,
  });

  project.save((err) => {
    if (err) throw err;
  });

  res.redirect('/');
});

module.exports = router;
