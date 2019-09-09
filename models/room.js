const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: undefined,
  },
}, {
  timestamps: true,
});

roomSchema.methods.addMessage = function addMessage(message) {
  this.messages.push(message);
  this.lastMessage = message;
};

roomSchema.methods.convertToClientObject = function convertToClientObject() {
  const clientObject = {};

  clientObject._id = this._id;
  clientObject.createdAt = this.createdAt;
  clientObject.lastMessage = this.lastMessage;
  clientObject.messages = this.messages;
  clientObject.users = [...this.invitedUsers, ...this.users];

  return clientObject;
};

module.exports = mongoose.model('Room', roomSchema);
