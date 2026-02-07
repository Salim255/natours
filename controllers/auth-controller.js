const crypto = require('crypto');
const { promisify } = require('util'); //We need this in orderer to use promisify method with the verification function(async..)
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync'); //we wrap all asynchronous function into this fucntion 
// so that we don't need to write the try catch block in each and every function

const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); //.sign(payload, ..)Payload is just an object for all the data.THIS ALL WE NEED TO LOGIN A NEW USER
};

///***COOKIES ***///
// Cookies is basically just a small piece of text that a server can send to clients, then when the client receives a cookies, it will automatically store it and then automaticaaly send it back along with all future requests to the same server
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), //convert to mil second
    //secure: true, //So cookie will only be sent on an encrypted connection
    httpOnly: true, //So this will make so that the cookie cannot be accessed or modified in any way by the browser, its just a super secure way off storing cookies
  };

  res.cookie('jwt', token, cookieOptions); //This is how to send a cookie

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  user.password = undefined; //To dnt show the password with the new document

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    //passwordResetToken: req.boy.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires,
  }); //By doing this we only allow the data that we need to be entered by the user,(WE CONTROLING THE USERS INPUT)
  createSendToken(newUser, 201, res);
}); //We called signup in order to create a new user, because signup has more mining in the context of authentication, than cratingUser() as we did with toursin tourControler

////Now all we need to do is to implement the route so that this signup handler here then get called. SO LETS GO TO THE userRoute...

//**** LOG IN USER IN */
exports.login = catchAsync(async (req, res, next) => {
  //const email =  req.body.email;
  const { email, password } = req.body;

  //1) Weneed to check if email and password exist
  if (!email || !password) {
    return next(new AppError('Plese provide email and password', 400));
  }

  //2)check if the user exist && password is correct
  const user = await User.findOne({ email }).select('+password'); //email:email, we '+password' to make it selceted
  //const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3)If everthing ok, send the token to client
  createSendToken(user, 200, res);
});

//In order to delete the cookies, we creat a new cookie with new token that doesnt match any user
exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

//****We create a middelware that check if the user is allowed to get access to the all tours */
exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting the token and check if its exist,
  
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } //reading  token from the header
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } //by this we can olso athuntiquet a user by token send in a cookies, not only the autherisation header

  if (!token) {
    return next(
      new AppError('You are not logged in!, Please log in to get access.', 401)
    );
  }
  //2)Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // We verify if someone manipulated the data OR the token has already expired), This promisify turn this function in async the return a promise, And the result of this promise will be the decoded payload from this JWT.

  //3)Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  //4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //iat mean issued at
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; //req.user will be passed to the nrxt middleware in case we want
  //Now we make this user accsssible to our template, each and every pug template will have access to response.locals and what ever we put there  will then be a variable inside of these template, so its litle bite like passing data inside template using render()
  
  res.locals.user = currentUser;
  next();
});

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2)Check if user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3)Check if the user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //THERE IS A LOGGED IN USER
      //Now we make this user accsssible to our template, each and every pug template will have access to response.locals and what ever we put there  will then be a variable inside of these template, so its litle bite like passing data inside template using render()
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array might be  ['admin', 'lead-guide']. role='user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You don not have permission to perfom this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on Posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  //2)Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //In order the change that we made, and we should des activte all the validators in our schema be adding(validator:false)

  //3)send it to user mail

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`; //It is the click  where user can lick in order to go and chang there password

  const message = `Forgot your password? Submit a PATCH request with new password and passwordConfirm to: ${resetURL}.\nIf you didn't forgot your password, please ignore this email! `;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); //In order the change that we made. and we should des activte all the validators in our schema be adding(validator:false)

    return next(
      new AppError('There was an error sending the email, Try again later!'),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); //Find the user with the token AND check if the user has nt expired

  //2)If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined; //in order to delete the reset Token
  user.passwordResetExpires = undefined;
  //now we need to save modified documents
  await user.save();

  //3)Update changedPasswordAt property for the user

  //4)Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  //2)Check if POSTed current the password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  //3)If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4)Log user in , send JWT
  createSendToken(user, 200, res);
});
