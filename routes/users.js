const express = require('express');

const router = express.Router();
const Project = require('../models/project');
const User = require('../models/user');
const Friendrequest = require('../models/friendrequest');
const Room = require('../models/room');
const Message = require('../models/message');

router.get('/', async (req, res) => {
  const { field, value } = req.query;
  const { projectId } = req.session;
  const decodedValue = decodeURIComponent(value);
  const match = /^\/.*\/$/.test(decodedValue) ? new RegExp(decodedValue.slice(1, -1)) : decodedValue;
  const filter = {};
  let project = null;

  filter[field] = match;

  project = await Project.findById(projectId).populate({
    path: 'users',
    match: filter,
  }).then();

  res.send(project.users.map((user) => user.convertToClientObject()));
});

router.get('/:id/friends', async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .populate('friends')
    .then();
  const friends = user.friends.map((friend) => friend.convertToClientObject());

  res.send(friends);
});

router.get('/auth/signout', async (req, res) => {
  const { userId, socketId } = req.session;
  const socket = req.io.sockets.connected[socketId];
  let user = null;

  await User.findByIdAndUpdate(userId, { $set: { isPresent: false } }).then();

  user = await User.findById(userId)
    .populate('friends')
    .then();

  user.friends.forEach((friend) => {
    req.io.to(friend._id).emit('friend-presence-changed', user.convertToClientObject());
  });

  req.session.userId = '';
  socket.leave(userId);
  res.send();
});

router.post('/', async (req, res, next) => {
  const { email, password, nickname } = req.body;
  const { projectId, socketId } = req.session;

  const project = await Project.findById(projectId).then();

  let user = new User({
    projectId: project._id,
    email,
    password,
    nickname,
  });

  try {
    user = await user.save().then();
    project.users.push(user);
    await project.save().then();
    req.session.userId = user._id;
    req.io.to(socketId).emit('user-state-changed', user.convertToClientObject());
    res.send(user.convertToClientObject());
  } catch (error) {
    console.error(error);
    next();
  }
});

router.post('/auth/signin', async (req, res, next) => {
  const { email, password } = req.body;
  const { projectId, socketId } = req.session;
  const socket = req.io.sockets.connected[socketId];
  let user = null;

  const project = await Project.findById(projectId)
    .populate({
      path: 'users',
      match: {
        email,
        password,
      },
    }).then();

  if (!project.users.length) {
    next();
    return;
  }

  [user] = project.users;

  // update present state
  await User.findByIdAndUpdate(user._id, { $set: { isPresent: true } }).then();

  user = await User.findById(user._id)
    .populate({
      path: 'friendrequests',
      populate: { path: 'from to' },
    })
    .populate({
      path: 'friends',
    })
    .populate({
      path: 'rooms',
      populate: { path: 'users invitedUsers' },
    })
    .then();

  user.friends.forEach((friend) => {
    req.io.to(friend._id).emit('friend-presence-changed', user.convertToClientObject());
  });

  req.session.userId = user._id;
  socket.join(user._id);
  req.io.to(socketId).emit('user-state-changed', user.convertToClientObject());
  res.send(user.convertToCurrentUserObject());
});

router.post('/:id/friendrequests', async (req, res) => {
  const { userId: senderId } = req.session;
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

router.post('/:id/friends/:friendId/remove', async (req, res, next) => {
  const { id, friendId } = req.params;
  const { userId } = req.session;

  if (userId !== id) {
    next();
    return;
  }

  const user = await User.findById(userId).then();
  const friend = await User.findById(friendId).then();

  user.friends = user.friends.filter((eachFriendId) => eachFriendId.toString() !== friendId);
  friend.friends = friend.friends.filter((eachFriendId) => eachFriendId.toString() !== userId);

  await user.save();
  await friend.save();

  req.io.to(userId).emit('friend-removed', friend.convertToClientObject());
  req.io.to(friendId).emit('friend-removed', user.convertToClientObject());

  res.send(friend.convertToClientObject());
});

router.post('/:id/rooms/:roomId/leave', async (req, res, next) => {
  const { id, roomId } = req.params;
  const { userId, socketId } = req.session;
  const socket = req.io.sockets.connected[socketId];
  let leftUser = null;
  let room = null;
  let message = null;

  if (id !== userId) {
    next();
    return;
  }

  await User.findByIdAndUpdate(userId, { $pull: { rooms: roomId } }).then();
  await Room.findByIdAndUpdate(roomId, { $pull: { users: userId } }).then();

  leftUser = await User.findById(userId).then();

  room = await Room.findById(roomId)
    .populate({
      path: 'users',
      select: '_id email nickname isPresent',
    })
    .populate('lastMessage')
    .then();

  message = new Message({
    type: 'leave',
    room: room._id,
    sender: leftUser._id,
    text: `${leftUser.nickname} has left the room.`,
  });

  message = await message.save();
  room.addMessage(message);
  await room.save();

  message = await Message.findById(message._id)
    .populate('room')
    .populate({
      path: 'sender',
      select: '_id email nickname isPresent',
    })
    .then();

  socket.emit('room-removed', room);
  room.users.forEach((user) => {
    req.io.to(user._id).emit('room-updated', room);
    req.io.to(user._id).emit('message', message);
  });

  // delete room and all messages
  if (room.users.length === 0) {
    await Message.deleteMany({ room: room._id }).then();
    await Room.findByIdAndDelete(room._id).then();
  }

  res.send();
});

module.exports = router;
