const createError = require('http-errors');

// NPM install cookie-parser
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Routs
const usersRouter = require('./routes/users-route');

const app = express();

app.use(logger('dev'));

module.exports = app;