LOG_LEVEL            = process.env.LOG_LEVEL || "info"
REDIS_URL            = process.env.REDIS_URL || "redis://:foobared@localhost"  // PLEASE CHANGE THIS!
SESSION_SECRET       = process.env.SESSION_SECRET || "$uperSecretSessionKey!"  // PLEASE CHANGE THIS!
SAML_NAME            = process.env.SAML_NAME || "passport"
SAML_LOGIN           = process.env.SAML_LOGIN || "https://dev-16390586.okta.com/home/dev-16390586_passport_1/0oa5begx161wbOnjq5d7/aln5benk36ZJHZRqE5d7"
SAML_LOGIN_CALLBACK  = process.env.SAML_CALLBACK || "/auth/saml/callback"
SAML_LOGOUT          = process.env.SAML_LOGOUT || "https://dev-16390586.okta.com/app/dev-16390586_passport_1/exk5begx15lTDCVmY5d7/slo/saml"
SAML_LOGOUT_CALLBACK = process.env.SAML_LOGOUT_CALLBACK || "/auth/saml/logout"
SAML_CERT_SP_KEY     = process.env.SAML_CERT_SP_KEY || "certificates/sp.key"  // Service Provider Certificate priv key. Pub key is needed on IDP for logout
SAML_CERT_IDP        = process.env.SAML_CERT_IDP || "certificates/idp.crt"  // Identity Provider public Certificate.
SAML_SIGNATURE       = process.env.SAML_SIGNATURE || "sha256"
SAML_DIGEST          = process.env.SAML_DIGEST || "sha256"

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
const cookieParser = require('cookie-parser');  // For lastURL cookie
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
      path: SAML_LOGIN_CALLBACK,
      entryPoint: SAML_LOGIN,
      logoutUrl: SAML_LOGOUT,
      issuer: SAML_NAME,
      signatureAlgorithm: SAML_SIGNATURE,
      digestAlgorithm: SAML_DIGEST,
      privateKey: fs.readFileSync(SAML_CERT_SP_KEY , "utf-8"),
      cert: fs.readFileSync(SAML_CERT_IDP, "utf-8"),
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

// COOKIE-PARSER
app.use(express.cookieParser());

// DEBUG MIDDLEWARE
app.use(function (req, res, next) {
  if ( true ){
    log.debug('Middleware path:',req.method, req.path)
  }
  next()
})

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
      log.info(req.cookies)
      res.redirect("/auth");
    }
);

// SAML LOGOUT
app.get('/auth/saml/logout', function (req,res,next) {

  log.info("LOGOUT:", req?.user?.id );

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
app.post( SAML_LOGOUT_CALLBACK , function (req,res,next) {
  log.info("LOGOUT: SAML Callback");
  req.logOut();										// logout
  req.session.destroy(function(){						// delete the auth session 
    res.redirect('/auth');
    // res.json("logged_out");
  });								
})

// STATUS
app.get('/auth/status', passport.checkLogin, (req, res) => {
  if (req.user) {
    res.json(req.user)  
    console.log(`logged_in as ${req.user.id}`)  
  }
  else {
    res.json('logged_in without user id?')
    console.log(`logged_in without user id}`)  
  }
  
})

// STATIC WEB PAGE
app.use("/auth",express.static('frontend/dist'))


// CUSTOM 404 HANDLER
app.use(function(req, res, next) {
  log.error('auth - 404',req.method, req.path)
  res.status(404);
  res.type('txt').send('auth - 404');
});

module.exports = app;