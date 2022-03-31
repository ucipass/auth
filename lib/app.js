REDIS_URL = 'redis://:foobared@172.18.2.64'
LOG_LEVEL = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "debug"

var log = require("ucipass-logger")("app")
log.transports.console.level = LOG_LEVEL


const express = require('express');
const app = express();
const session = require("express-session")
let RedisStore = require("connect-redis")(session)


// redis@v4
const { createClient } = require("redis")
let redisClient = createClient(
  { 
    legacyMode: true,
    url: REDIS_URL
  }
)
redisClient.connect().catch(console.error)


//SESSION
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    secret: "keyboard cat",
    resave: false,
  })
)


// DEBUG MIDDLEWARE
app.use(function (req, res, next) {
  if ( true ){
    log.debug('Middleware path:',req.path)
  }
  next()
})

app.get('/auth/status', (req, res) => {
  res.send('up')
})

app.get('/auth/login', (req, res) => {
  res.send('login')
})

app.get('/auth/logout', (req, res) => {
  res.send('logout')
})


// CUSTOM 404 HANDLER
app.use(function(req, res, next) {
  res.status(404);

  // respond with html page
  // if (req.accepts('html')) {
  //   res.render('404', { url: req.url });
  //   return;
  // }    

  // default to plain-text. send()
  res.type('txt').send('404');
});

module.exports = app;