const fs = require('fs');
const dotenv = require('dotenv'); //we need this to connect our node app to the configue file
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const Tour = require('../../models/tour-model');

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


// READ JSO file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

// Import data into database
const importData = async() => {
    try {
        await Tour.create(tours);
        console.log('Data successfully loaded')
    } catch (error) {
        console.log(error);
    }
}

// DELETE ALL DATA from COLLECTION
const deleteData = async() => {
    try {
        await Tour.deleteMany();
        console.log('Data successfully deleted')
    } catch (error) {
        
    }
}

console.log(process.argv)