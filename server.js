const http = require('http');

// Bring the APP
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Debug
const debug = require('debug')('Natour:server')

// Create the sever
const server  = http.createServer(app);

// Run the server to listen
server.listen(PORT, () => {
  console.log("Sever running on port", PORT);
})

