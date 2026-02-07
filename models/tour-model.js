const mongoose = require('mongoose'); //To allow our Node code to access and interact with the a mongoDB database
const slugify = require('slugify');

//const User = require('./userModel');
//const validator = require('validator');
//to create the schema

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true, // will remove all the white space in the begging and the end of the string
      required: [true, 'A tour must have a name'], //we call this validator
      unique: true,
      maxlength: [40, 'A tour name must have less or equal than  40 characters'],
      minlength: [
        10,
        'A tour name must have more or equal than  10 characters',
      ],
      //validate: [validator.isAlpha, 'Tour name must only contain chars'], //its a function to call ..,
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //enum is only for strings
        values: ['easy', 'medium', 'difficult'], //here we pass the values that are allowed
        message: 'Difficulty is either:  easy or medium or  difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10 ) / 10,//4.666666, 4.6666, 47, 4.7//call seter fucntion, will be run each time a new value been set for this field
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //his only point to the current doc in new document creation, but not with update
        validator: function (discountValue) {
          return discountValue < this.price; //we trigger validation error when the return is false
        },
        message: 'Discount price({VALUE}) should be below to the regular price', //VALUE have access to the realy value
      },
    },
    summary: {
      type: String,
      trim: true, //will remove all the white space in the begining and the end of the string
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //to do not show the date of the creation
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //
      //we use GeoJson in order to specify geospecial data with mongoDB,
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //1)guides: Array//FOR EMBADING

    //2) Referancing
    guides: [
      {
        type: mongoose.Schema.ObjectId, //Means we expected type of each of the elemnts in the guides array to be a MongoDB ID
        ref: 'User',
      },
    ],
  },
  {
    //passing options, getting the virual properties to the document/object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//tourSchema.index({price: 1});//with index w'll scan only the part that concerne our cherche, so good performance

tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug:1});
tourSchema.index({startLocation:'2dsphere'});
tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

//Virtual populate
//Virtual populate
//Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', //the tour field in the Review model
    localField: '_id' //_id of the tour in the Tour model
    //look for the _id of the tour in the tour field in review
});

//Document middleware: runs before  only .save() and .create() but not .insertMany()
tourSchema.pre('save', function (next) {
  //every pre middleware have acces to next

  this.slug = slugify(this.name, { lower: true }); //console.log(this);//This point to the currently proccess document, so here we have access to the document that gonna be saved, so we can make any change befre to be saved or create
  next();
}); //Pre means it gonna run before the actuel event('save') in this case

/* tourSchema.pre('save' ,async function(next) {//THIS CODE FOR EMBADING USESRS INTO TOURS
   const guidesPromises = this.guides.map( async id=> await User.findById(id));
   this.guides = await Promise.all(guidesPromises);
   next();
}); */

// tourSchema.pre('save', function(next){
//     console.log('Will save document...');
//     next();
// });//we can have mutiple pr or post middlewar  for the same Hook(means save or creat), we can cn say pre save Hook or pre save middleware

// tourSchema.post('save', function(doc,next){
//     console.log(doc);//doc is the finish document
//     next();
// }); //With post we have access to the document that has just saved to the database, and post excuted after all pre middlewar have completed

//Query Middlewar, pre will run before the command find excuted
//tourSchema.pre('find', function (next)
tourSchema.pre(/^find/, function (next) {
  ///^find/ means all the expression that start by find
  //and the this Keyword herewill point to the current query object and not th document
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    //in query middleware we use this.---
    path: 'guides',
    select: '-__v -passwordChangedAt',
  }); //Poplate in order to fillup the field guides inside the tour, ThisPopulate is afondamuntal tools for working with datas in mongoose
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query has took  ${Date.now() - this.start} milliseconds !`);
  //console.log(docs);
  next();
});

// //AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //we use unshift to add to the bigigning of an array
//   console.log(this.pipeline()); //this point to the current aggrigation object
//   next();
// });

//to creat the model using the schema
const Tour = mongoose.model('Tour', tourSchema); //we alq¡ways use uppercase in model name and variables

module.exports = Tour;
