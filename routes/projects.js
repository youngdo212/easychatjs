const express = require('express');

const router = express.Router();
const Project = require('../models/project');
const User = require('../models/user');

router.get('/:apiKey', async (req, res, next) => {
  const { apiKey } = req.params;
  const { userId, socketId } = req.session;
  const socket = req.io.sockets.connected[socketId];
  const project = await Project.findOne({ apiKey });
  console.log(project.id);
  const user = await User.findById(userId).then();

  if (!project) {
    next();
    return;
  }

  req.session.projectId = project._id;
  userId && socket.join(userId);
  res.send(user ? user.convertToClientObject() : null);
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
