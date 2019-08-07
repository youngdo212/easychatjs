const mongoose = require('mongoose');
const cryptoRandomString = require('crypto-random-string');

const projectSchema = new mongoose.Schema({
  accountId: mongoose.Schema.Types.ObjectId,
  name: String,
  apiKey: {
    type: String,
    default: cryptoRandomString.bind(this, {length: 15})
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
});

module.exports = new mongoose.model('Project', projectSchema);