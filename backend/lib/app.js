import { config } from "./config.js"
import {log}  from "./log.js"
import express    from 'express';
import serveIndex from 'serve-index';
import { createClient } from 'redis';
import RedisStore from "connect-redis"
import session from 'express-session';
import passport from 'passport';
import crypto from 'crypto';
import { Strategy as LocalStrategy } from 'passport-local';
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // absolute path of the current module file.
const __dirname = path.dirname(__filename);
const isValidDirectory = (path) => fs.existsSync(path) && fs.statSync(path).isDirectory();

const app = express()

const redisClient = createClient({ url: config.redis_url });
redisClient.on('error', err => console.log('Redis Client Error', err));
await redisClient.connect();

// SESSION
app.use(
  session({
    store: new RedisStore({ 
      client: redisClient,
      prefix: config.redis_session // Set your redis prefix here
    }),
    secret: config.session_secret, // Secret passed on as env
    saveUninitialized: false, // Don't create session until something stored
    resave: false,
    // name: 'sessionId', // Custom cookie name
    // httpOnly: true, // Ensures cookie is sent only over HTTP(S), not client JavaScript, helping to protect against cross-site scripting attacks.
    // sameSite: 'strict', // Can be 'lax' or 'strict', providing CSRF protection
    cookie: { 
      maxAge: 8 * 3600000 // 8 hours in milliseconds
    }    
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

async function validateUser (username, password){
  // return username == password
  try {
    const key = config.redis_userdb + ":" + username
    const value = await redisClient.get(key)
    if (! value) return false
    const user = JSON.parse(value)
    const hash = crypto.createHash('sha256');
    hash.update( password + user.salt );
    const base64 = hash.digest('base64'); 
    return user.base64 == base64   
  } catch (error) {
    log.error("Redis password validation exception!")
    log.error(error)
    return false
  }
}

// Passport Local Strategy
passport.use(new LocalStrategy(
    async (username, password, done) => {
        if ( await validateUser(username, password) ) {
            const user = {id:username}
            log.info(`logged in as ${username}`)  
          return done(null, user);
        } else {
          log.error(`loging failed for user: ${username}`)
          return done(null, false, { message: 'Incorrect password.' });
        }
    }
  ));

passport.serializeUser(function(user, done) {
  log.debug(`serialize in as ${user}`)  
	return done(null, user); // THIS IS WHERE THE user id is supposed to be put in an external session db)
})

passport.deserializeUser(function(user, done) {
  log.debug(`deserialize in as ${user}`)  
	return done(null, user);    // THIS IS WHERE THE user id is supposed to be checked against an external session db)
})

passport.checkLogin = function(req, res, next) {
	if (req.isAuthenticated()){
		return next();
    }
	res.status(401).send("401 - unauthorized");
  log.error(`Unautorized access for ${req.originalUrl}`)
}


// LOGIN
app.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json( user );
    });
  })(req, res, next);
});

// LOGOUT
app.get('/auth/logout', (req, res) => {
  const username = req.user ? req.user.id : null;
  req.logout(function(err) {
    if (err) {
      // Handle any errors that occurred during logout
      console.error(err);
      return res.redirect('/error'); // Redirect to a suitable page with an error message if needed
    }
    // Successful logout, return json
    log.info(`logged out as ${username}`) 
    res.json('successful logout');
  });
});



// LOGIN CHECK
app.get('/auth/login', passport.checkLogin, (req, res) => {
  if (req.user) {
    res.json(req.user)  
    log.info(`connected as ${req.user.id}`)  
  }
  else {
    res.json('connected without user id.')
    log.error(`connected without user id}`)  
  }
})

// STATIC WEB PAGE
// Serve static files from the Vue app build directory
app.use("/auth", express.static(config.frontend_dir));

// STATIC FILES DIRECTORY
// Serve static files from the files directory if present
if ( config.files_dir && !! isValidDirectory(config.files_dir)){
  log.error
}

if ( config.files_dir && isValidDirectory(config.files_dir)){
  app.use( "/auth/files", passport.checkLogin , express.static(config.files_dir), serveIndex( config.files_dir, {'icons': true}))
}


app.get('*', (req, res) => {
  res.sendFile(path.join( config.frontend_dir , 'index.html'));
});

// CUSTOM 404 HANDLER
app.use(function(req, res, next) {
  const msg = '404 - not found'
  log.error(msg,req.method, req.path)
  res.status(404);
  res.type('txt').send(msg);
});

export {app}