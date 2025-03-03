//! Creating this file as we know while connecting DB we need to remember 2 points
//! 1> Use try catch block to handle the error
//! 2> Use async await (as db is in another continent)

//? Below are 2 methods, we can use whichever we want.

// Method I: Using Promise
const asyncHandler = (func) => {
  (err, req, res, next) => {
    Promise.resolve(func(err, req, res, next))  
    .catch((err)=> next(err));  
  };
};

// Method II: Using try catch block
// const asyncHandler = (func) => { async (err, req, res, next) => {
//   try {
//     await func(err, req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }}

export { asyncHandler };
