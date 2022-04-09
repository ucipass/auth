process.on('SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    process.exit(0);
});

process.on('SIGTERM', function() {
    console.log( "\nGracefully shutting down from SIGTERM" );
    process.exit(0);
});

PORT = process.env.PORT ? process.env.PORT : "80"

const Server = require("./lib/httpserver.js")
const app    = require("./lib/app.js")  
const log    = require("ucipass-logger")("auth_main")

const server = new Server( {app: app, port: PORT})   
server.start()
.catch((error)=>{
    log.error("Failed to start server",error.message)
})