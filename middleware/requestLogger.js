const logger = require("./logger");

module.exports = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `[${req.headers["x-request-id"]}] [${req.method}]: ${req.headers["x-real-ip"]} - ${req.headers["x-scheme"]} ${req.headers.host} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 200 && res.statusCode < 300) {
      logger.success(message);
    } else if (res.statusCode >= 400) {
      logger.error(message);
    } else {
      logger.info(message);
    }
  });

  next();
};
