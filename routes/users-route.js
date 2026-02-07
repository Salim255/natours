const express = require('express');
const userController = require('./../controllers/users-controller'); //an object of variables
const authController = require('./../controllers/auth-controller');

//creating new router as a middleware
const router = express.Router();//This router here is just lik a mini app so we cans use it lik: router.use(any middleware)


//4)ROUTES*******************************************************

router.post('/signup', authController.signup); //We also have a special route for authentication
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);///So in order to protect all the route comes after this middleware from no signed user w

router.patch(
  '/updateMyPassword',
  authController.updatePassword
);

router.get('/me', userController.getMe, userController.getUser);//authController.protect  =>to verify that the user is logged in, 
// and will added the ser to the current request,
// then we can read the id fro the current user  
router.patch('/updateMe',  userController.updateMe);
router.delete('/deleteMe',  userController.deleteMe);


router.use(authController.restrictTo('admin'));//The route that comes after ar restrict to amin use 

/////Routes in REST format
router.route('/').get(userController.getAllUsers).post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);


module.exports = router;
