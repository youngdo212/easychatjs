const mongoose = require('mongoose');

const friendrequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

friendrequestSchema.methods.convertToClientObject = function convertToClientObject() {
  return {
    _id: this._id,
    from: this.from.convertToClientObject(),
    to: this.to.convertToClientObject(),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Friendrequest', friendrequestSchema);
