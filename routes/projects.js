const express = require('express');

const router = express.Router();
const Project = require('../models/project');
const User = require('../models/user');

router.get('/:apiKey', async (req, res, next) => {
  const { apiKey } = req.params;
  const { userId } = req.session;
  const project = await Project.findOne({ apiKey });
  const user = await User.findById(userId)
    // will be removed
    .populate({
      path: 'friendrequests',
      populate: { path: 'from to' },
    })
    // will be removed
    .populate({
      path: 'rooms',
      populate: { path: 'users invitedUsers' },
    })
    .then();

  if (!project) {
    next();
    return;
  }

  req.session.projectId = project._id;

  res.send(user ? user.convertToCurrentUserObject() : null);
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
