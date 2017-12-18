const mongoose = require('mongoose');

const Channel = mongoose.model('channel', {
  _id: String,
  categories: [{
    category: String,
    count: Number,
  }],
});

module.exports = { Channel };
