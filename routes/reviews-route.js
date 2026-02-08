const express = require('express');
const reviewController = require('./../controllers/reviews-controller'); // an object of variables

// Creating new router as a middleware
const router = express.Router({mergeParams: true});//we need to merge the parameter in order to get access to ID from other route, in this case is reviewRouter
const authController = require('./../controllers/auth-controller');



// POST/tour/66ef46r4vr/reviews
// POST/ reviews

router.use(authController.protect);

router.route('/')
.get( reviewController.getAllReviews)
.post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
); // this the root(/) /=== '/api/v1/reviews'


router.route('/:id')
.get(reviewController.getReview)
.patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
)
.delete(
    authController.restrictTo('user', 'admin')
    ,reviewController.deleteReview,
);

module.exports = router; //To be used in app.js