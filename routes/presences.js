const express = require('express');

const router = express.Router();
const User = require('../models/user');
const Friendrequest = require('../models/friendrequest');
const Room = require('../models/room');

router.get('/out', async (req, res) => {
  const { userId } = req.session;
  let user = null;

  await User.findByIdAndUpdate(userId, { $set: { isPresent: false } }).then();

  user = await User.findById(userId)
    .populate('friends')
    .then();

  user.friends.forEach((friend) => {
    req.io.to(friend._id).emit('friend-presence-changed', user.convertToClientObject());
  });
  req.io.to(userId).emit('user-state-changed', null);

  res.send();
});

router.post('/in', async (req, res) => {
  const { userId, socketId } = req.session;
  const socket = req.io.sockets.connected[socketId];
  let user = null;

  await User.findByIdAndUpdate(userId, { $set: { isPresent: true } }).then();

  user = await User.findById(userId)
    .populate('friends')
    .populate('rooms')
    .then();

  user.friends.reduce((promises, friend) => {
    req.io.to(friend._id).emit('friend-presence-changed', user.convertToClientObject());

    return promises.then(() => new Promise((resolve) => {
      socket.emit('friend-added', friend.convertToClientObject(), () => {
        resolve();
      });
    }));
  }, Promise.resolve());

  user.rooms.reduce(async (promises, room) => {
    const roomForClient = await Room.findById(room._id)
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

    return promises.then(() => new Promise((resolve) => {
      socket.emit('room-added', roomForClient.convertToClientObject(), () => {
        resolve();
      });
    }));
  }, Promise.resolve());

  res.send();
});

module.exports = router;
