const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const User = require('../models/user');
const Friendrequest = require('../models/friendrequest');

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
  const socket = req.io.sockets.connected[socketId];
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
  socket.join(user._id);
  req.io.to(socketId).emit('user-state-changed', user.convertToClientObject());
  res.send();
});

router.post('/:id/friendrequests', async (req, res, next) => {
  const {projectId, socketId, userId: senderId} = req.session;
  const receiverId = req.params.id;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  const friendrequest = new Friendrequest({
    from: sender._id,
    to: receiver._id,
  });

  await friendrequest.save();
  receiver.friendrequests.push(friendrequest);
  await receiver.save();

  const friendrequestForClient = await Friendrequest.findById(friendrequest._id)
    .populate({
      path: 'from',
      select: '_id email nickname isPresent',
    })
    .populate({
      path: 'to',
      select: '_id email nickname isPresent',
    })
    .then();
  
  req.io.to(receiverId).emit('friend-requested', friendrequestForClient);
  res.send();
});

router.post('/:id/friends/:friendId', async (req, res, next) => {
  const {behavior} = req.body;
  const {id, friendId} = req.params;
  const {userId} = req.session;

  if(userId !== id) return next();

  await User.findByIdAndUpdate(userId, {$pull: {friends: friendId}}).then();
  await User.findByIdAndUpdate(friendId, {$pull: {friends: userId}}).then();

  req.io.to(userId).emit('friend-removed', friendId);
  req.io.to(friendId).emit('friend-removed', userId);

  res.send();
})

module.exports = router;