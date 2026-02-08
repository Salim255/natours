const mongoose = require('mongoose');
//review /rating / createdAt / ref to tour / ref to user
const Tour = require('./tour-model');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review Can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    //Parents refercencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      requierd: [true, 'Review must belong to a tour.'],
    },
    //Parent refercencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong tp a user.'],
    },
  },
  {
    //passing options, getting the virtual properties to the document/object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


reviewSchema.index({tour: 1, user: 1}, {unique: true}); // mains each combination of tour and user have to be unique, so no one user with more than reviewin the same tour(one your = one reveiw)

reviewSchema.pre(/^find/, function () {
  // this.populate({
  //   //in query middleware we use this.---
  //   path: 'tour',
  //   select: 'name', // only need tour name and nothing else
  // }).populate({ 
  //   path: 'user', 
  //   select: 'name photo' }); //Populate in order to fill up the field guides inside the tour, ThisPopulate is afondamuntal tools for working with datas in mongoose

  this.populate({ 
    path: 'user', 
    select: 'name photo' }); //Populate in order to fill up the field guides inside the tour, ThisPopulate is a fond  tools for working with datas in mongoose
  //next();
});

////Static method in mongoose

reviewSchema.statics.calcAverageRatings  = async function(tourId){

  const stats = await this.aggregate([
     {
       $match: {tour: tourId}
     },
     {
       $group: {
       _id:'$tour',
       nRating: {$sum: 1},
       avgRating: {$avg: '$rating'}
     }
    }
   ]); // method like this, this keyword  always to the current model

   console.log(stats);
  if(stats.length>0){
      await Tour.findByIdAndUpdate(tourId, {
     ratingsAverage: stats[0].avgRating,
     ratingsQuantity: stats[0].nRating,
   })
  }else{
    await Tour.findByIdAndUpdate(tourId, {
     ratingsAverage: 0,
     ratingsQuantity: 4.5,
   })
  }
  
};

reviewSchema.post('save', function(){
  //this point to the current review 
  this.constructor.calcAverageRatings(this.tour);//Tour represent the tourId that we specified the aggragation  ;//this point to the current document(review) and constructor point to the model that creat this documnt, in this case is the tourModel
 
});


//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(){
  this.r = await this.findOne();//here this keyword is for the current query(findOneAnd). by this.findOne() w'll get the document currently been proccessed.
  
  //next();
});//In fact findOneAnd its just a shortand of //findByIdAndUpdate and 
//findByIdAndDelete

reviewSchema.post(/^findOneAnd/,async function(){
  // await this.findOne(); donsnt work here because the query has already excuted
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
