const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  email: String,
  password: String,
  nickname: String,
});

module.exports = new mongoose.model('Account', accountSchema);