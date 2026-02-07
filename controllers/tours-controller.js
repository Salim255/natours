const Tour = require('./../models/tour-model');
const catchAsync = require('./../utils/catch-async');
const AppError = require('./../utils/app-error');
const factory = require('./handler-factory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

//we JSON to onvert to java script
exports.getAllTours = factory.getAll(Tour);
//Using get to read data
//geting variable, the variable can be var id or anything
exports.getTour = factory.getOne(Tour, {path: 'reviews'});//papulate option object
//Using Post to creat
// exports.creatTour = (req, res) => {
exports.creatTour =factory.createOne(Tour)
//to update params of un object we use patch
exports.updatTour = factory.updateOne(Tour);
//To delete un object form an API
exports.deleteTour = factory.deleteOne(Tour);

//AGGREGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, //+1 from down to up and -1 from up to down
    },
    // {
    //   $match:{_id:{$ne: 'EASY'}}
    // }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //We are grouping them by the month
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, //to creat an array we use push
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, //to show or notthe id by using (0 or 1)
      },
    },
    {
      $sort: {
        numTourStarts: -1, //we can use 1 or -1 to sort them -1 start with the highest
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan: plan,
    },
  });
});

// /tour-within?disatance=233&center=-40,45&unit=mi
//or /tour-within/distance/233/center/-40,45/unit/mi
exports.getToursWithin =catchAsync(async (req, res, next) =>{
  const {distance, latlng, unit} = req.params;
  const [lat,lng] = latlng.split(',');//latetude and longtude

  const radius = unit === 'mi'? distance/3963.2 : distance / 6378.1;//to convrt the actuel distance in radius
  if(!lat || !lng){
    next(new AppError('Please provide latitude and longitude in the format lat, lng'), 400);
  }
  
  const tours = await Tour.find({startLocation: {$geoWithin:{$centerSphere: [[lng, lat], radius]}}});
  res.status(200).json({
    status:'success',
    results: tours.length,
    data:{
      data: tours
    }
  })
}) ;


exports.getDistances = catchAsync(async(req, res, next)=>{
  const {latlng, unit} = req.params;
  const [lat,lng] = latlng.split(',');//latetude and longtude
  const multiplier =unit === 'mi'? 0.000621371 : 0.001;
  if(!lat || !lng){
    next(new AppError('Please provide latitude and longitude in the format lat, lng'), 400);
  }
  
  //In order to calculation we always need the aggregationpinpline
 const distances = await Tour.aggregate([
   {
     $geoNear:{
       near: {
         type: 'Point',
         coordinates:[lng*1, lat *1]
       },
       distanceField:'distance', //where all the the calculated distances will be stored 
       distanceMultiplier: multiplier//in order to convert the distance from metrs to mi
     },//alway need to be the first,and geoNear always neeed a start location, here we use the stratLocation that defined in tourModel, but if there more than startLocation, we need to specify the name for the GeoNear
    
   },
   { $project: {//in order to have only the distance and the name of the tour
       distance: 1,
       name: 1
     }
  }
   
 ]);
    res.status(200).json({
    status:'success',
    
    data:{
      data: distances
    }
  })
  
})