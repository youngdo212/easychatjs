const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const Room = require('../models/room');
const User = require('../models/user');
const Message = require('../models/message');

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const room = await Room.findById(id)
    .populate('invitedUsers')
    .populate('users')
    .populate('lastMessage')
    .then();

  res.send(room.convertToClientObject());
});

router.post('/', async (req, res, next) => {
  const { userId, socketId } = req.session;
  const { addUserIds } = req.body;
  const invitedUserObjectIds = addUserIds.map((addUserId) => mongoose.Types.ObjectId(addUserId));
  const socket = req.io.sockets.connected[socketId];

  if (!userId) {
    next();
    return;
  }

  const user = await User.findById(userId).then();
  const invitedUsers = await User.find({ _id: { $in: invitedUserObjectIds } }).then();

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
    })
    .populate({
      path: 'users',
    })
    .populate('lastMessage')
    .then();

  socket.emit('room-added', room.convertToClientObject());

  res.send(room.convertToClientObject());
});

router.post('/:id/messages', async (req, res) => {
  const { userId } = req.session;
  const { text } = req.body;
  const { id: roomId } = req.params;

  const user = await User.findById(userId).then();
  let room = await Room.findById(roomId)
    .populate('invitedUsers')
    .populate('users')
    .populate('lastMessage')
    .then();

  let message = new Message({
    room: room._id,
    sender: user._id,
    text,
  });

  message = await message.save();

  room.addMessage(message);
  room = await room.save();

  room.invitedUsers.forEach((invitedUser) => {
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

router.post('/:id/users', async (req, res, next) => {
  const { id: roomId } = req.params;
  const { userIds } = req.body;
  const invitedUserObjectIds = userIds.map((userId) => mongoose.Types.ObjectId(userId));
  let invitedUsers = await User.find({ _id: { $in: invitedUserObjectIds } }).then();
  let room = await Room.findById(roomId)
    .populate('invitedUsers')
    .populate('users')
    .populate('lastMessage')
    .then();

  invitedUsers = invitedUsers.filter((invitedUser) => !room.hasUser(invitedUser));

  if (!invitedUsers.length) {
    next();
    return;
  }

  invitedUsers.forEach((invitedUser) => {
    room.addUser(invitedUser);
  });

  let message = new Message({
    type: 'join',
    room: room._id,
    sender: invitedUsers[0]._id,
    text: `${invitedUsers.map((user) => user.nickname).join(', ')} has joined the room.`,
  });

  message = await message.save();

  room.addMessage(message);
  room = await room.save();

  message = await Message.findById(message._id)
    .populate('sender')
    .populate('room')
    .then();

  room.users.forEach((userInRoom) => {
    req.io.to(userInRoom._id).emit('room-updated', room.convertToClientObject());
    req.io.to(userInRoom._id).emit('message', message.convertToClientObject());
  });

  res.send();
});

module.exports = router;
