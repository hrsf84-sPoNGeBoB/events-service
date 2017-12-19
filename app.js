// const apm = require('elastic-apm-node').start({
//   // Set required app name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
//   appName: 'events_performance',
// });
const express = require('express');
const aws = require('aws-sdk');
const axios = require('axios');
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

  const eventObj = {
    event_type: eventType,
    video_id: videoId,
    video_category: videoCategory,
    channel_id: channelId,
    is_subscribed: isSubscribed,
    search_term: searchTerm,
  };

  const event = new Event(eventObj);
  event.save().then((doc) => {
    console.log(`event save time elapsed: ${new Date() - startTime}`);
    console.log(`saved event: ${doc}`);
    res.send();
  }).catch((err) => {
    res.status(500).send(err);
  });

  axios({
    method: 'post',
    url: 'http://localhost:7332/',
    data: JSON.stringify(eventObj),
    headers: { 'content-type': 'application/json' },
  }).then((doc) => {
    console.log('Sending to ES:', doc);
  }).catch((err) => {
    console.error('Logstash error:', err);
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
            doc.save().then(() => {
              console.log(`channel updated with cat: ${videoCategory}`);
              console.log(`channel save time elapsed: ${new Date() - startTime}`);
            });
          }
          channelCategories.categories.push(cat);
        }
      }
    }).catch(err => console.error(err));
  }
});

app.post('/test', (req, res) => {
  const calls = [];
  const cats = ['video_click', 'ad_click', 'ad_watch', 'video_exit', 'video_watch'];
  for (let i = 0; i < 5000; i += 1) {
    const et = cats[Math.floor(Math.random() * cats.length)];
    const eventObj = {
      event_type: et,
      video_id: Math.floor(Math.random() * 100000),
      video_category: 'Drama',
      channel_id: Math.floor(Math.random() * 1000),
      is_subscribed: Math.floor(Math.random() * 2) === 0,
      search_term: 'searchTerm',
    };
    // const event = new Event(eventObj);
    // saves.push(event.save());
    calls.push(axios({
      method: 'post',
      url: 'http://localhost:7332/',
      data: JSON.stringify(eventObj),
      headers: { 'content-type': 'application/json' },
    }).catch(() => {}));
  }
  Promise.all(calls).then(() => {
    console.log('done calling');
    res.send();
  }).catch(err => res.send(err));
});

// app.use(apm.middleware.express());

app.listen(port, () => console.log(`Listening on Port ${port}...`));
