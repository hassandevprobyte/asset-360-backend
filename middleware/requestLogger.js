const { randomUUID } = require("crypto");
const { UAParser } = require("ua-parser-js");
const logger = require("./logger");

// Environment Variables
const { env } = require("../config");

module.exports = (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  const userAgent = req.headers["user-agent"] || "";
  const parser = new UAParser(userAgent);

  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  res.on("finish", () => {
    const duration = Date.now() - start;

    const ip = req.headers["x-real-ip"] || req.ip;
    const protocol = req.headers["x-scheme"] || req.protocol;
    const userId = req.user?.id?.toString() || "-";

    const message = [
      `[Request: ${requestId}]`,
      `[User: ${userId}]`,
      `[Protocol: ${protocol}]`,
      `[Method: ${req.method}]`,
      `[URL: ${req.originalUrl}]`,
      `[IP: ${ip}]`,
      `[Browser: ${browser.name || "Unknown"} ${browser.version || ""}]`,
      `[OS: ${os.name || "Unknown"} ${os.version || ""}]`,
      `[Device: ${device.type || "desktop"}]`,
      `[Status: ${res.statusCode}]`,
      `[Referer: ${req.get("referer") || "-"}]`,
      `[Duration: ${duration}ms]`,
      `[Environment: ${env.NODE_ENV || "development"}]`,
    ].join(" ");

    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.error(message);
    } else if (res.statusCode >= 200 && res.statusCode < 400) {
      logger.success(message);
    } else {
      logger.info(message);
    }
  });

  next();
};
