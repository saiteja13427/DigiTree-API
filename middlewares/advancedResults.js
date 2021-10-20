//Short hand for a function inside function
const advancedResults = (model, populate) => async (req, res, next) => {
  let query, select, sort, page, limit, currentIndex, endIndex, totalCount;

  let reqQuery = { ...req.query };

  //Fields to be removed from the req query
  const removeFields = ["select", "sort", "limit"];

  //Deleting remove field from the req query
  removeFields.forEach((param) => {
    delete reqQuery[param];
  });

  //Converting the query json to string
  let queryStr = JSON.stringify(reqQuery);

  //Replacing the comparison operator x with $x so that we can directly pass it to mongoose find
  queryStr = queryStr.replace(
    /\b(lte|lt|gt|gte|in)\b/g,
    (match) => `$${match}`
  );

  //Finding the bootcamps
  query = model.find(JSON.parse(queryStr));

  //Creating a space separated string of to be selected fields which we have as , separated
  //As mongoose require a space separated string to be passed in select function
  if (req.query.select) {
    select = req.query.select.split(",").join(" ");
    query.select(select);
  }

  //Sort fields
  if (req.query.sort) {
    sort = req.query.sort.split(",").join(" ");
    query.sort(sort);
  } else {
    query.sort("-createdAt");
  }

  //Pagination
  page = parseInt(req.query.page, 10) || 1;
  limit = parseInt(req.query.limit, 10) || 10;
  currentIndex = limit * (page - 1);
  endIndex = page * limit;
  totalCount = await model.countDocuments();

  query.skip(currentIndex).limit(limit);

  //Populating
  if (populate) {
    query = query.populate(populate);
  }

  //Executing find with await
  const results = await query;

  //pagination next and prev
  let pagination = {};

  if (currentIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  if (endIndex < totalCount) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
