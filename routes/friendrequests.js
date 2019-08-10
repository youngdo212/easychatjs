const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Friendrequest = require('../models/friendrequest');

router.get('/:id/accept', async (req, res, next) => {
  const {userId} = req.session;
  const friendrequestId = req.params.id;
  const friendrequest = await Friendrequest.findById(friendrequestId)
    .populate('from')
    .then();
  const sender = friendrequest.from;
  const receiver = await User.findById(userId).then();

  sender.friends.push(receiver);
  receiver.friends.push(sender);

  await sender.save();
  await receiver.save();

  req.io.to(sender._id).emit('friend-added', receiver.convertToClientObject());
  req.io.to(receiver._id).emit('friend-added', sender.convertToClientObject());

  await Friendrequest.findByIdAndDelete(friendrequestId).then();
  await User.findByIdAndUpdate(receiver._id, {$pull: {friendrequests: friendrequestId}}).then();

  res.send();
})

router.get('/:id/decline', async (req, res, next) => {
  const {userId} = req.session;
  const friendrequestId = req.params.id;
  const receiver = await User.findById(userId).then();

  await Friendrequest.findByIdAndDelete(friendrequestId).then();
  await User.findByIdAndUpdate(receiver._id, {$pull: {friendrequests: friendrequestId}}).then();

  res.send();
})

module.exports = router;