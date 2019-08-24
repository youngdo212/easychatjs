const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const Room = require('../models/room');
const User = require('../models/user');
const Message = require('../models/message');

router.get('/:id/messages', async (req, res, next) => {
  const { userId, socketId } = req.session;
  const { id: roomId } = req.params;
  const socket = req.io.sockets.connected[socketId];
  const room = await Room.findById(roomId)
    .populate('messages')
    .populate('lastMessage')
    .then();

  if (!userId) {
    next();
    return;
  }

  room.messages.reduce(async (promises, message) => {
    const messageForClient = await Message.findById(message._id)
      .populate('room')
      .populate('sender')
      .then();

    return promises.then(() => new Promise((resolve) => {
      socket.emit('message', messageForClient, () => {
        resolve();
      });
    }));
  }, Promise.resolve());

  res.send();
});

router.post('/', async (req, res, next) => {
  const { userId, socketId } = req.session;
  const { inviteUserIds } = req.body;
  const inviteUserObjectIds = inviteUserIds.map((inviteUserId) => mongoose.Types.ObjectId(inviteUserId));
  const socket = req.io.sockets.connected[socketId];

  if (!userId) {
    next();
    return;
  }

  const user = await User.findById(userId).then();
  const invitedUsers = await User.find({ _id: { $in: inviteUserObjectIds } }).then();

  let room = await new Room();
  room = await room.save();

  user.rooms.push(room);
  await user.save();

  room.users.push(user);
  invitedUsers.forEach((invitedUser) => {
    room.invitedUsers.push(invitedUser);
  });

  room = await room.save();
  room = await Room.findById(room._id)
    .populate({
      path: 'invitedUsers',
      select: '_id email nickname isPresent',
    })
    .populate({
      path: 'users',
      select: '_id email nickname isPresent',
    })
    .populate('lastMessage')
    .then();

  socket.emit('room-added', room.convertToClientObject());

  res.send();
});

router.post('/:id/messages', async (req, res) => {
  const { userId } = req.session;
  const { text } = req.body;
  const { id: roomId } = req.params;

  const user = await User.findById(userId).then();
  let room = await Room.findById(roomId)
    .populate({
      path: 'invitedUsers',
      select: '_id email nickname isPresent',
    })
    .populate({
      path: 'users',
      select: '_id email nickname isPresent',
    })
    .populate('lastMessage')
    .then();
  const invitedUserObjectIds = room.invitedUsers.map((invitedUser) => invitedUser._id);
  const invitedUsers = await User.find({ _id: { $in: invitedUserObjectIds } }).then();

  let message = new Message({
    room: room._id,
    sender: user._id,
    text,
  });

  message = await message.save();

  room.addMessage(message);
  room = await room.save();

  invitedUsers.forEach((invitedUser) => {
    invitedUser.rooms.push(room);
    invitedUser.save();
  });

  message = await Message.findById(message._id)
    .populate({
      path: 'sender',
      select: '_id email nickname isPresent',
    })
    .populate('room')
    .then();

  room.invitedUsers.forEach((invitedUser) => {
    req.io.to(invitedUser._id).emit('room-added', room.convertToClientObject());
    req.io.to(invitedUser._id).emit('message', message);
  });

  room.users.forEach((userInRoom) => {
    req.io.to(userInRoom._id).emit('message', message);
    req.io.to(userInRoom._id).emit('room-updated', room.convertToClientObject());
  });

  room.users.push(...room.invitedUsers);
  room.invitedUsers = [];
  room.save();

  res.send();
});

router.post('/:id/users', async (req, res) => {
  const { id: roomId } = req.params;
  const { userId } = req.body;
  const user = await User.findById(userId).then();
  let room = await Room.findById(roomId)
    .populate({
      path: 'invitedUsers',
      select: '_id email nickname isPresent',
    })
    .populate({
      path: 'users',
      select: '_id email nickname isPresent',
    })
    .populate('lastMessage')
    .then();

  let message = new Message({
    type: 'join',
    room: room._id,
    sender: user._id,
    text: `${user.nickname} has joined the room.`,
  });

  message = await message.save();

  room.invitedUsers.push(user);
  room.addMessage(message);
  room = await room.save();

  message = await Message.findById(message._id)
    .populate({
      path: 'sender',
      select: '_id email nickname isPresent',
    })
    .populate('room')
    .then();

  room.users.forEach((userInRoom) => {
    req.io.to(userInRoom._id).emit('room-updated', room.convertToClientObject());
    req.io.to(userInRoom._id).emit('message', message);
  });

  res.send();
});

module.exports = router;
