const httpserver = require("./lib/httpserver.js")

const port = 3000
const app = require("./lib/app.js")    
const server = new httpserver( {app:app, port:port})   
server.start()
.catch((error)=>{
    console.log("Failed to start server",error.message)
})