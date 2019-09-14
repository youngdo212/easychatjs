const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'text', // join || leave
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  text: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

messageSchema.methods.convertToClientObject = function convertToClientObject() {
  return {
    _id: this._id,
    type: this.type,
    room: this.room,
    sender: this.sender.convertToClientObject(),
    text: this.text,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Message', messageSchema);
