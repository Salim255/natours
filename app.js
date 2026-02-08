const createError = require('http-errors');

// NPM install cookie-parser
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Routs
const userRouter = require('./routes/users-route');
const tourRouter = require('./routes/tours-route');
const reviewRouter = require('./routes/reviews-route');
const viewRouter = require('./routes/views-route')

const app = express();

app.use(logger('dev'));

// Engine

//PUG ENGINE tell Express the template that we gonna use
app.set('view engine', 'pug'); // we don't need to install pug or require it
//We need also de define where this view is located in the file system, PUG template called views in Express
app.set('views', path.join(__dirname, 'views')); //this will create the path to views folder


//Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Routers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

module.exports = app;