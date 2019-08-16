const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
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
  }
}, {
  timestamps: true,
})

roomSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.lastMessage = message;
}

module.exports = new mongoose.model('Room', roomSchema);