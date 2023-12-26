import { createClient } from 'redis';
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url); // absolute path of the current module file.
const __dirname = path.dirname(__filename); // absolute path of the current module file's directory.
const isValidDirectory = (path) => fs.existsSync(path) && fs.statSync(path).isDirectory();


const PORT           = process.env.PORT ? process.env.PORT : "80"
const LOGLEVEL       = process.env.LOGLEVEL ? process.env.LOGLEVEL : "info"
const USERNAME       = process.env.USERNAME ? process.env.USERNAME : "admin"
const PASSWORD       = process.env.PASSWORD ? process.env.PASSWORD : "admin"
const REDIS_URL      = process.env.REDIS_URL ? process.env.REDIS_URL : 'redis://admin:foobared@redis.home/2'
const REDIS_SESSION  = process.env.REDIS_SESSION ? process.env.REDIS_SESSION : 'auth'  // prefix used in redis for session                                                                                                                 
const REDIS_USERDB   = process.env.REDIS_USERDB ? process.env.REDIS_USERDB : 'userdb'  // prefix used in redis for user db
const SESSION_SECRET = process.env.SESSION_SECRET ? process.env.SESSION_SECRET : "$uper$ecret"
const FRONTEND_DIR   = process.env.FRONTEND_DIR ? path.join( __dirname, process.env.FRONTEND_DIR ) : path.join(__dirname , './../dist')
const FILES_DIR      = process.env.FILES_DIR 

// REDIS CONNECT CHECK
const client = createClient({
        url: REDIS_URL
    });
client.on('error', err => {
    console.log('Redis Client Error', err)
    process.exit(1);
});
await client.connect();
const key = REDIS_USERDB + ":" + USERNAME
const exists = await client.exists(key);
if (exists === 0) {
    // username does not exists
    const salt = crypto.randomBytes(16).toString('base64'); // Generate a random salt
    const password = PASSWORD
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    const base64 = hash.digest('base64');
    const value = {
        username : USERNAME,
        salt: salt,
        base64: base64
    }
    await client.set(key, JSON.stringify(value));
    console.log(`Key '${key}' created with value '${value}'`);
} 
await client.disconnect();

// FRONTEND_DIR CHECK
if (! isValidDirectory (FRONTEND_DIR)){
    console.log('Invalid frontend directiry:', FRONTEND_DIR)
    process.exit(1);
}

// FILES_DIR CHECK
if ( FILES_DIR && ! isValidDirectory (FILES_DIR)){
    console.log('Invalid files directory:', FILES_DIR)
    process.exit(1);
}


const config = {
    port: PORT,
    loglevel : LOGLEVEL,
    redis_url : REDIS_URL,
    redis_session: REDIS_SESSION,
    redis_userdb: REDIS_USERDB,
    session_secret: SESSION_SECRET,
    frontend_dir : FRONTEND_DIR,
    files_dir : FILES_DIR
};

export {config} ;
