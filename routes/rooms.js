const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Room = require('../models/room');
const User = require('../models/user');
const Message = require('../models/message');

router.get('/:id/messages', async (req, res, next) => {
  const {userId, socketId} = req.session;
  const {id: roomId} = req.params;
  const socket = req.io.sockets.connected[socketId];
  const room = await Room.findById(roomId)
    .populate('messages')
    .populate('lastMessage')
    .then();

  if(!userId) return next();

  room.messages.reduce(async (promises, message) => {
    const messageForClient = await Message.findById(message._id)
      .populate('room')
      .populate('sender')
      .then();

    return promises.then(() => {
      return new Promise((resolve) => {
        socket.emit('message', messageForClient, () => {
          resolve();
        })
      })
    })
  }, Promise.resolve());

  res.send();
})

router.post('/', async (req, res, next) => {
  const {userId} = req.session;
  const {userIds} = req.body;
  const allUserIds = [userId, ...userIds];
  const allUserObjectIds = allUserIds.map(id => mongoose.Types.ObjectId(id));

  const room = await new Room({
    users: allUserIds,
  });

  await room.save();

  const users = await User.find({_id: {$in: allUserObjectIds}})
    .then();

  const roomForClient = await Room.findById(room._id)
    .populate({
      path: 'users',
      select: '_id email nickname isPresent',
    })
    .then();

  users.forEach((user) => {
    user.rooms.push(room);
    user.save();
    req.io.to(user._id).emit('room-added', roomForClient);
  });

  res.send();
})

router.post('/:id/messages', async (req, res, next) => {
  const {userId} = req.session;
  const {text} = req.body;
  const {id: roomId} = req.params;
  const user = await User.findById(userId).then();
  let room = await Room.findById(roomId)
    .populate({
      path: 'users',
      select: '_id email nickname isPresent',
    })
    .populate('lastMessage')
    .then();

  let message = new Message({
    room: room._id,
    sender: user._id,
    text,
  })

  message = await message.save();

  room.addMessage(message);
  room = await room.save();

  message = await Message.findById(message._id)
    .populate({
      path: 'sender',
      select: '_id email nickname isPresent',
    })
    .populate('room')
    .then();

  room.users.forEach((user) => {
    req.io.to(user._id).emit('message', message);
    req.io.to(user._id).emit('room-updated', room);
  });

  res.send();
})

module.exports = router;