import { config } from "./lib/config.js"
import { log }    from "./lib/log.js"
import { app }     from "./lib/app.js"  
import { Server } from "./lib/httpserver.js"

process.on('SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    process.exit(0);
});

process.on('SIGTERM', function() {
    console.log( "\nGracefully shutting down from SIGTERM" );
    process.exit(0);
});

log.info("Starting Auth Service")

const server = new Server( {app: app, port: config.port})   
server.start()
.catch((error)=>{
    log.error("Failed to start server",error.message)
})
