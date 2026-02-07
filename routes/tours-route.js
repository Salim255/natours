const express = require('express');
const tourController = require('./../controllers/tours-controller'); //an object of variables
const reviewRouter = require('./../routes/reviewsRoute');
const authController = require('./../controllers/authController');

// creating new router as a middleware
const router = express.Router();

// NeSTED ROUTE
//POST/tour/66ef46r4vr/reviews
//Get/tour/jnw57454wd5/reviews



router.use('/:tourId/reviews', reviewRouter);//We said this tour router should use the reviewRouter..., keep in mid that router it self it just a middleware, we just said when ever we find a URL like '/:tourId/reviews' then call reviewRouter 


router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide'),tourController.getMonthlyPlan);//:year, called URL parametre

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// /tour-within?disatance=233&center=-40,45&unit=mi
//or /tours-within/:distance/center/:-40,45/unit/mi
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

//calculate the distance for all the tours from  points
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router.route('/').get(tourController.getAllTours).post(authController.protect, authController.restrictTo("admin", "lead-guide", 'guide'),tourController.createTour); // this the root(/)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'),tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);
// tourRouter.route('/api/v1/tours').get(getAllTours).post(createTour);
// tourRouter.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour);



module.exports = router;
