class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1A) Filtring
    const queryObj = { ...this.queryString };
    const excludeField = ['page', 'sort', 'limit', 'fields'];
    excludeField.forEach((el) => delete queryObj[el]);
    //console.log(req.query, queryObj);

    //1B) Advance filtring
    let queryStr = JSON.stringify(queryObj); //To convertthe object into string

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //\b \b means exat string, g means if there are more than one occurance
    console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));
    return this; //its the entier object
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy);
      this.query = this.query.sort(this.queryString.sort); //to sort fromupto down we use sort=-price
      //sort('price raingsAverage ...')
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields /*'name, duration, price'*/);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    console.log(page, limit, skip);
    //page=2&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
    this.query = this.query.skip(skip).limit(limit); //skip mean to to jumb 10 by 10

    return this;
  }
}

module.exports = APIFeatures;
