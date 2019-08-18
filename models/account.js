const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  email: String,
  password: String,
  nickname: String,
});

module.exports = mongoose.model('Account', accountSchema);
