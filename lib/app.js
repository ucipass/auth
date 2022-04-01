REDIS_URL = process.env.REDIS_URL ? process.env.REDIS_URL : "redis://:foobared@localhost"
LOG_LEVEL = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"
USERNAME = process.env.USERNAME ? process.env.USERNAME : "admin"
PASSWORD = process.env.PASSWORD ? process.env.PASSWORD : "admin"


var log = require("ucipass-logger")("app")
log.transports.console.level = LOG_LEVEL
log.debug(`REDIS_URL:${REDIS_URL}, USERNAME:${USERNAME}, LOG_LEVEL:${LOG_LEVEL}\n`)


const express = require('express');
const app = express();
const session = require("express-session")
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
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
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    secret: "keyboard cat",
    resave: false,
  })
)
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function(username, password, done) {  // THIS MUST come from POST on body.username and body.passport

  if( username == USERNAME  && password == PASSWORD){
    return done(null, {id:username});	// PASSPORT puts this in the user object for serialization
  }
  else{
    return done(null, false);
  }    
  

}))

passport.serializeUser(function(user, done) {
	return done(null, user.id); // THIS IS WHERE THE user id is supposed to be put in an external session db)
})

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



// DEBUG MIDDLEWARE
app.use(function (req, res, next) {
  if ( true ){
    log.debug('Middleware path:',req.method, req.path)
  }
  next()
})

app.post('/auth/login', function (req,res,next) {
  passport.authenticate('local', function(err, user, info) {				// LOGIN SEND post data to LocalStrategy body.username body.passport to CHECK11

    log.debug("authenticate: Username",user,"IP:",req.clientIp);										// LocalStrategy returns user object   
    if (err) { 
      log.error("authenticate ERROR:","IP:",req.clientIp);
      return next(err); 
    }                    //If error return next with error
    
    //If user is provided then it means auth is ssuccessful
    if (user ) {
      //Request the actual Login from passport user object will be par or 'req'
      req.logIn(user, function(err) {                                     
        if (err) { 
          log.error("authentication internal error: User:",user,"IP:",req.clientIp)
          return next(err); //If error return next with error
        }

        // LOGING IS COMPLETE!!!!
        log.info("Passport  auth success user:",user.id,"IP:",req.clientIp)
        // return res.json("success");
        return res.status(err ? 500 : 200).send(err ? err : user);
        // return res.redirect('')
      });     


    } 
    // Auth failure 
    else{
      if (process.env.NODE_ENV == 'testing' || process.env.NODE_ENV == 'development'){
        log.info("Authentication failed","IP:",req.clientIp);
      }
      else{
        log.error("Authentication failed","IP:",req.clientIp);
      }    
      return res.status(401).send("unauthorized");
    }

	})(req, res, next);	

})

app.all('/auth/logout', function (req,res,next) {
    log.info("LOGOUT:", ( req.user !== undefined ? req.user: 'Anonnymous'));
    req.logOut();										// logout
    req.session.destroy(function(){						// delete the auth session 
      res.json("logged_out");
    });								
   
  })

app.get('/auth/login', passport.checkLogin, (req, res) => {
  res.json('logged_in')
})


// CUSTOM 404 HANDLER
app.use(function(req, res, next) {
  log.error('404:',req.method, req.path)
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