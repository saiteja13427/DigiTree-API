//@desc     Log requests to console with method and url
exports.logger = (req, res, next) => {
  console.log(`${req.method} ${req.protocol}://${req.get("host")}${req.url}`);
  next();
};
