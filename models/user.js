const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  email: String,
  password: String,
  nickname: String,
  friendrequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friendrequest',
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isPresent: {
    type: Boolean,
    default: false,
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  }],
});

userSchema.methods.convertToClientObject = function convertToClientObject() {
  return {
    _id: this._id,
    email: this.email,
    nickname: this.nickname,
    isPresent: this.isPresent,
  };
};

module.exports = mongoose.model('User', userSchema);
