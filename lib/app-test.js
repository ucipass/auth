REDIS_URL      = process.env.REDIS_URL ? process.env.REDIS_URL : "redis://:foobared@localhost"
LOG_LEVEL      = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"
SESSION_SECRET = process.env.SESSION_SECRET ? process.env.SESSION_SECRET : "$uperSecretSessionKey!"

const log = require("ucipass-logger")("app")
log.transports.console.level = LOG_LEVEL
log.debug(`REDIS_URL:${REDIS_URL}, LOG_LEVEL:${LOG_LEVEL}\n`)


const express = require('express');
const app = express();
const session = require("express-session")
const cors = require('cors') // ONLY FOR DEVELOPMENT!!!
const passport = require('passport');
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

// SESSION
app.use(cors({origin:true,credentials: true}));; //PLEASE REMOVE FOR PRODUCTION
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    secret: SESSION_SECRET,
    resave: false,
  })
)
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());
passport.deserializeUser(function(id, done) {
	return done(null, {id:id});    // THIS IS WHERE THE user id is supposed to be checked against an external session db)
})
passport.checkLogin = function(req, res, next) {
	if (req.isAuthenticated()){
		return next();
    }
  if (process.env.NODE_ENV == 'testing'){
    log.warn("AUTH - NOT LOGGED IN IP:",req.clientIp);
  }else{
    log.error("AUTH - NOT LOGGED IN IP:",req.clientIp);
  }
	res.status(401).send("unauthorized");
}


// MAIN STUFF

app.get('*', passport.checkLogin, (req, res) => {
  message = `authorized as: ${req.user.id}`
  res.json(message)
  log.info(message)
})




// CUSTOM 404 HANDLER
app.use(function(req, res, next) {
  log.error('unauthorized - 404',req.method, req.path)
  res.status(404);
  res.type('txt').send('unauthorized - 404');
});

module.exports = app;