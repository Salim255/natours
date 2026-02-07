const Tour = require('./../models/tour-model');
const User = require('./../models/user-model');
const Review = require('./../models/review-model');
const factory = require('./handler-factory');



exports.setTourUserIds = (req, res, next)=>{
  if(!req.body.tour) req.body.tour = req.params.tourId;
  if(!req.body.user) req.body.user = req.user.id;//we git this from protect middleware
  next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);