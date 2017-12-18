const mongoose = require('mongoose');

const Event = mongoose.model('event', {
  event_type: {
    type: String,
    required: true,
  },
  video_id: String,
  video_category: String,
  channel_id: String,
  is_subscribed: Boolean,
  search_term: String,
});

module.exports = { Event };
