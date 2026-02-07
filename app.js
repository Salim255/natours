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

// Routers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

module.exports = app;