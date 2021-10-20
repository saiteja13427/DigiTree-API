//@Working  fn is a function the asyncHandler recieves and it returns a function with (req, res, next) arguments
//returns a promise which on resolving runs the function it recieved otherwise catches the err and passes it to
//next i.e next middleware

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
