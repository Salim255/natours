const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator'); //Its a validator coming from npm
const bcrypt = require('bcryptjs');
//1) create userSchema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //to hide the password from any output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This only work on CREATE and SAVE
      validator: function (el) {
        return el === this.password; //remember This only work in save()!!
      },
      message: 'The password are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false, //to dont be shown on the user information
  },
});

// /************************ ENCRYPTING THE PASSWORD***********************/
//W'll use mongoose middleware, and the one that we gonna use is a pre-save middleware
userSchema.pre('save', async function (next) {
  //we need NEXT in order to call the next middleware

  //Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  /****we need to install bcryptjs package in order to use encrypting: npm i bcryptjs *******/

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12); //using hash to ecncrypt the password

  //Delete the passwordConfirm field
  this.passwordConfirm = undefined;

  next();
}); //pre mean between geting the data and saving the data to the database

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //To ensure that the token is always created after the password has been changed. thats is we  give the passwordChanedAt the actual time - one sencend
  next();
});

//pre.. we call them query middlewar, (/^find/ => mean looking for word or strings that start by find)
//
userSchema.pre(/^find/, function (next) {
  //And what w'll do here is before finding the document we want to remove that have active property siting to false
  //this=> point to the current query => find.
  this.find({ active: { $ne: false } });
  next();
});

/*****INSTANCE METHODE middleware */
//Its basically a methode gonna be available on all documents of certain collection

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword); //return true or false
};
//An other instance methode
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //To change the time to seconde

    return JWTTimestamp < changedeTimestamp; //If the JWT < changed that is means there are a change of the password after the token been isssued
  }

  //False means there are non change in the password
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  //w'll use this function in autentification controler
  //The password reset token should basically be a random string
  const resetToken = crypto.randomBytes(32).toString('hex'); //This token that w'll send to the user , so the user can use in ordrer to create the new password, it behave lik a password.

  //Now we should encrypt this resetToken using buitl-in crypto module.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 minute in millseconds

  return resetToken;
};
//Creating the model out of our schema
const User = mongoose.model('User', userSchema);

module.exports = User;
