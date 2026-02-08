const dotenv = require('dotenv'); //we need this to connect our node app to the configue file
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const http = require('http');

// Bring the APP
const app = require('./app');




const DB = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD
);

console.log( DB)
mongoose
  //.connect(process.env.DATABASE_LOCAL, {to connect to the local server
  .connect(DB)
  .then(() => {
    console.log('DB connection successful');
  }); //this connect will return a promese

const PORT = process.env.PORT || 8000;

// Debug
const debug = require('debug')('Natour:server')

// Create the sever
const server  = http.createServer(app);

// Run the server to listen
server.listen(PORT, () => {
  console.log("Sever running on port", PORT);
})

