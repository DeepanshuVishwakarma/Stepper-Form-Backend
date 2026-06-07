const { status_code } = require("../utils/statics/statics");

function errorHandler(err, req, res, next) {
  const status = err.statusCode || status_code.INTERNAL_SERVER_ERROR;

  res.status(status).json({
    message: err?.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" ? { stack: err?.stack } : {}),
  });
}

module.exports = errorHandler;

