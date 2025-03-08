class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message = "Something went wrong.",
    public errors = [],
    stack = "",
    public success = false,
    public data = null
  ) {
    super(message);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}