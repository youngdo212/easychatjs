const express = require('express');

const router = express.Router();
const Project = require('../models/project');
const Account = require('../models/account');

router.post('/', async (req, res, next) => {
  const { accountId } = req.session;
  const { projectId, whiteUrl } = req.body;
  const account = await Account.findById(accountId);

  if (!account) {
    return next();
  }

  const projects = await Project.find({ accountId });

  if (!projects) {
    return next();
  }

  const project = projects.find(
    (project) => project._id.toString() === projectId
  );

  if (!project) {
    return next();
  }

  project.whitelist.push(whiteUrl);
  await project.save();

  res.redirect('/');
});

router.delete('/', async (req, res, next) => {
  const { accountId } = req.session;
  const { projectId, whiteUrl } = req.body;
  const account = await Account.findById(accountId);

  if (!account) {
    console.log('1');
    return next();
  }

  const projects = await Project.find({ accountId });

  if (!projects) {
    console.log('2');
    return next();
  }

  const project = projects.find(
    (project) => project._id.toString() === projectId
  );

  if (!project) {
    console.log('3');
    return next();
  }

  project.whitelist = project.whitelist.filter((item) => item !== whiteUrl);
  await project.save();

  res.redirect(303, '/');
});

module.exports = router;
