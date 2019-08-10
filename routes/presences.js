const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Friendrequest = require('../models/friendrequest');

router.get('/out', async (req, res, next) => {
  const {userId} = req.session;
  const user = await User.findById(userId)
    .populate('friends')
    .then();
  
  await User.findByIdAndUpdate(userId, {$set: {isPresent: false}}).then();
  user.friends.forEach((friend) => {
    req.io.to(friend._id).emit('friend-presence-changed', user.convertToClientObject());
  })
  req.io.to(userId).emit('user-state-changed', null);

  res.redirect('/');
});

router.post('/in', async (req, res, next) => {
  const {userId, socketId} = req.session;
  const socket = req.io.sockets.connected[socketId];
  const user = await User.findById(userId)
    .populate('friends')
    .populate({
      path: 'friendrequests',
      options: {
        sort: {createdAt: 'ascending'},
      },
    })
    .then();

  await User.findByIdAndUpdate(userId, {$set: {isPresent: true}}).then();

  user.friends.reduce((promises, friend) => {
    req.io.to(friend._id).emit('friend-presence-changed', user.convertToClientObject());

    return promises.then(() => {
      return new Promise((resolve) => {
        socket.emit('friend-added', friend.convertToClientObject(), () => {
          resolve();
        });
      });
    });
  }, Promise.resolve());

  user.friendrequests.reduce(async (promises, friendrequest) => {
    const friendrequestForClient = await Friendrequest.findById(friendrequest._id)
      .populate({
        path: 'from',
        select: '_id email nickname',
      })
      .populate({
        path: 'to',
        select: '_id email nickname',
      })
      .then();

    return promises.then(() => {
      return new Promise((resolve) => {
        socket.emit('friend-requested', friendrequestForClient, () => {
          resolve()
        });
      });
    })
  }, Promise.resolve());
})

module.exports = router;