const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const User = require('../models/user');

router.get('/', async (req, res, next) => {
  const {field, value} = req.query;
  const projectId = req.session.projectId;
  const decodedValue = decodeURIComponent(value);
  const match = /^\/.*\/$/.test(decodedValue) ? new RegExp(decodedValue.slice(1, -1)) : decodedValue;
  const filter = {};
  let project = null;

  filter[field] = match;

  project = await Project.findById(projectId).populate({
    path: 'users',
    match: filter,
  }).then();
  
  res.send(project.users.map(user => user.convertToClientObject()));
});

router.post('/', async (req, res, next) => {
  const {email, password, nickname} = req.body;
  const {projectId, socketId} = req.session;

  const project = await Project.findById(projectId).then();

  let user = new User({
    projectId: project._id,
    email,
    password,
    nickname,
  })

  try {
    user = await user.save().then();
    project.users.push(user);
    await project.save().then();
    req.session.userId = user._id;
    req.io.to(socketId).emit('user-state-changed', user.convertToClientObject());
    res.send();
  } catch(error) {
    console.error(error);
    next();
  }
});

router.post('/auth/signin', async (req, res, next) => {
  const {email, password} = req.body;
  const {projectId, socketId} = req.session;
  let user = null;

  const project = await Project.findById(projectId).populate({
    path: 'users',
    match: {
      email,
      password,
    },
  }).then();

  if(!project.users.length) return next();

  user = project.users[0];
  req.session.userId = user._id;
  req.io.to(socketId).emit('user-state-changed', user.convertToClientObject());
  res.send();
});

module.exports = router;