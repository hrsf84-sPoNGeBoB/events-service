const express = require('express');
const bodyParser = require('body-parser');
require('./db/mongoose');
const { Event } = require('./db/models/event');
const { Channel } = require('./db/models/channel');

const app = express();
const port = process.env.PORT || 7331;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('hi');
});

app.post('/events', (req, res) => {
  const startTime = new Date();

  console.log(req.body);
  const {
    eventType,
    videoId,
    videoCategory,
    channelId,
    isSubscribed,
    searchTerm,
  } = req.body;

  const event = new Event({
    event_type: eventType,
    video_id: videoId,
    video_category: videoCategory,
    channel_id: channelId,
    is_subscribed: isSubscribed,
    search_term: searchTerm,
  });
  event.save().then((doc) => {
    console.log(`event save time elapsed: ${new Date() - startTime}`);
    console.log(`saved event: ${doc}`);
    res.send();
  }).catch((err) => {
    res.status(500).send(err);
  });

  if (eventType === 'video_click') {
    Channel.findById(channelId).then((doc) => {
      const channelCategories = {
        channelId,
      };
      if (!doc) {
        console.log(`didn't find ID: ${channelId}`);
        channelCategories.categories = [{
          category: videoCategory,
          count: 1,
        }];
        const channel = new Channel({
          _id: channelId,
          categories: channelCategories.categories,
        });
        channel.save().then((newDoc) => {
          console.log(`saved new doc: ${newDoc}`);
        });
      } else {
        channelCategories.categories = [];
        for (let i = 0; i < doc.categories.length; i += 1) {
          const cat = doc.categories[i];
          if (doc.categories[i].category === videoCategory) {
            cat.count += 1;
            doc.save().then((result) => {
              console.log(`new count: ${result}`);
              console.log(`channel updated with cat: ${videoCategory}`);
            });
          }
          channelCategories.categories.push(cat);
        }
      }
    }).catch(err => console.error(err));
  }
});

app.listen(port, () => console.log(`Listening on Port ${port}...`));
