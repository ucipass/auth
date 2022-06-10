REDIS_URL      = process.env.REDIS_URL ? process.env.REDIS_URL : "redis://:foobared@localhost"
LOG_LEVEL      = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"
SESSION_SECRET = process.env.SESSION_SECRET ? process.env.SESSION_SECRET : "$uperSecretSessionKey!"
USERNAME = process.env.USERNAME ? process.env.USERNAME : "admin"
PASSWORD = process.env.PASSWORD ? process.env.PASSWORD : "admin"

const log = require("ucipass-logger")("app")
log.transports.console.level = LOG_LEVEL
log.debug(`REDIS_URL:${REDIS_URL}, LOG_LEVEL:${LOG_LEVEL}\n`)


const fs = require('fs');
const express = require('express');
const app = express();
const session = require("express-session")
const cors = require('cors') // ONLY FOR DEVELOPMENT!!!
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const SamlStrategy = require('passport-saml').Strategy;
const bodyParser = require("body-parser");
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

//PLEASE REMOVE FOR PRODUCTION
// app.use(cors({origin:true,credentials: true}));; 

// SESSION
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

// PASSPORT OLD LOCAL AUTH
// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new LocalStrategy(function(username, password, done) {  // THIS MUST come from POST on body.username and body.passport

//   if( username == USERNAME  && password == PASSWORD){
//     return done(null, {id:username});	// PASSPORT puts this in the user object for serialization
//   }
//   else{
//     return done(null, false);
//   }    
// }))


app.use(passport.initialize());
app.use(passport.session());
//disable caching
app.use((req, res, next) => {  
  res.set('Cache-Control', 'no-store')
  next()
})

// SAML STRATEGY
passport.use(
  new SamlStrategy(
    {
      path: "/auth/saml/callback",
      entryPoint: "https://dev-16390586.okta.com/home/dev-16390586_passport_1/0oa5begx161wbOnjq5d7/aln5benk36ZJHZRqE5d7",
      logoutUrl: "https://dev-16390586.okta.com/app/dev-16390586_passport_1/exk5begx15lTDCVmY5d7/slo/saml",
      issuer: "passport",
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",

      // additionalLogoutParams: {
      //   identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
      // },

      privateKey: fs.readFileSync("./test.key", "utf-8"),
      cert: "MIIDqDCCApCgAwIBAgIGAYFA2DmdMA0GCSqGSIb3DQEBCwUAMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzENMAsGA1UECgwET2t0YTEU      MBIGA1UECwwLU1NPUHJvdmlkZXIxFTATBgNVBAMMDGRldi0xNjM5MDU4NjEcMBoGCSqGSIb3DQEJARYNaW5mb0Bva3RhLmNvbTAeFw0yMjA2MDgwMTA0MjFaFw0zMjA2MDgwMTA1MjFaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzENMAsGA1UECgwET2t0YTEUMBIGA1UECwwLU1NPUHJvdmlkZXIxFTATBgNVBAMMDGRldi0xNjM5MDU4NjEcMBoGCSqGSIb3DQEJARYNaW5mb0Bva3RhLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKRUDMrx63CbpmI3tkh2fPUA4SH2LDUtP0qXshyzfjGYYoSLjjydBCCVOng/iU6At0COF06isvhCgQGeRnn/ldWrNeuXfghKNlejMpEgfOyKPECBY5OFhqFZTCJ1fAW5hR5Usx1IXwFZOPEL0Uyg72Owq5fs1+bNr0/fgywaiH/WWxPgMELssaTzEJby7OBmYXugJi0A4PTjoUi/CfLINP2cD+AoextfLaSmwfoool1M9Wtn5IAEABxpbiRpwtO8HOpwmDa4LOJ0i/0+xaM7gCHMVhfD26B7L2LukBZZkGiAoog2LCD8kCHIEVPwn8RYwT5ZDUKR6bMgEkcZD9AwhN0CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAILRvlLYhykX5wbLr5B11w9wnEd8mDWuY36qy/l4GbR/nsGey/H88wYY+pfsRoMH/87IcVBp3LScRdbM2vhcAOyHJeulQJWPEymluabR1YWlfYl4hBkHCrK3zKAZkJgCKbJvgiwBL9wXY/zcr5gxQlUqiJ1v4uT+qWtFdZd/NNy+nBwovHHzJxZAcZIr7bG2eMYvPU7jJEIu3u7oG9sddX7Va/NX/OtyuiLxrGlIqCmEKR2USpDxlvwJPEpJPIObUWi1ClqaOYwwcvpmzXtfeV108bezZUuKQhOzP2cZ2AD8gysSIvMOIghtaeTJ/Cwd2Zzhr0ZQsHnRSU2FNQ/l5HQ=="
      
    },
    function (profile, done) {
      // for signon

      user = { 
        id: profile.nameID,
        nameID: profile.nameID,  // Needed for SAML logout
        nameIDFormat: profile.nameIDFormat  // Needed for SAML logout
      }
      return done(null, user );

    },
    function (profile, done) {
      // for logout
      user = { id: profile.nameID}
      return done(null, user);
    }
  )
);


passport.serializeUser(function(user, done) {
	return done(null, user); // THIS IS WHERE THE user id is supposed to be put in an external session db)
})

passport.deserializeUser(function(user, done) {
	return done(null, user);    // THIS IS WHERE THE user id is supposed to be checked against an external session db)
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

app.use("/auth",express.static('frontend/dist'))

// SAML LOGIN
app.get(
  "/auth/saml/login",
  passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
  function (req, res) {
    res.redirect("/");
  }
);

// SAML LOGIN CALLBACK
app.all(
  "/auth/saml/callback",
  bodyParser.urlencoded({ extended: false }),
  passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
    function (req, res) {
      res.redirect("/auth");
    }
);

// SAML LOGOUT
app.get('/auth/saml/logout', function (req,res,next) {

  log.info("LOGOUT:", req.user.id );

  try {
    const strategy = passport._strategy('saml');
    strategy.logout(req, function(error, requestUrl) {
      if(error) console.log(`Can't generate log out url: ${err}`);
      req.logOut();
      delete req.session.passport;
      res.redirect(requestUrl);      
    });
  } catch(err) {
    if(err) console.log(`Exception on URL: ${err}`);
    req.logOut();
    delete req.session.passport;
    res.redirect('/auth');
  }

})
// SAML LOGOUT CALLBACK
app.post('/auth/saml/logout', function (req,res,next) {
  log.info("LOGOUT: SAML Callback");
  req.logOut();										// logout
  req.session.destroy(function(){						// delete the auth session 
    res.redirect('/auth');
    // res.json("logged_out");
  });								
})


// LOCAL LOGIN
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

app.get('/auth/status', passport.checkLogin, (req, res) => {
  if (req.user) {
    res.json(`logged_in as ${req.user.id}`)  
    console.log(`logged_in as ${req.user.id}`)  
  }
  else {
    res.json('logged_in without user id?')
    console.log(`logged_in without user id}`)  
  }
  
})


// CUSTOM 404 HANDLER
app.use(function(req, res, next) {
  log.error('auth - 404',req.method, req.path)
  res.status(404);

  // respond with html page
  // if (req.accepts('html')) {
  //   res.render('404', { url: req.url });
  //   return;
  // }    

  // default to plain-text. send()
  res.type('txt').send('auth - 404');
});

module.exports = app;