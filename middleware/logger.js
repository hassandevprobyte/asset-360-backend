const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");

// Constants
const COLORS = require("../constants/COLORS");

const LOG_CONFIG = {
  directory: path.join(process.cwd(), "logs"),
  rotationPeriod: "YYYY-ww",
  maxSize: "20m",
  retention: "28d",
};

fs.mkdirSync(LOG_CONFIG.directory, { recursive: true });

const levels = {
  error: 0,
  success: 1,
  info: 2,
};

winston.addColors({
  error: COLORS.RED,
  success: COLORS.GREEN,
  info: COLORS.CYAN,
});

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  }),
);

const onlyLevel = (level) => winston.format((info) => (info.level === level ? info : false))();

const createFileTransport = (level, maxFiles = LOG_CONFIG.retention) =>
  new DailyRotateFile({
    dirname: LOG_CONFIG.directory,
    filename: `${level}-%DATE%.csv`,
    datePattern: LOG_CONFIG.rotationPeriod,
    maxSize: LOG_CONFIG.maxSize,
    maxFiles,
    level,
    format: winston.format.combine(onlyLevel(level), logFormat),
  });

const logger = winston.createLogger({
  levels,
  level: "info",
  format: logFormat,
  transports: [
    createFileTransport("error"),
    createFileTransport("success"),
    createFileTransport("info"),

    new DailyRotateFile({
      dirname: LOG_CONFIG.directory,
      filename: "combined-%DATE%.csv",
      datePattern: LOG_CONFIG.rotationPeriod,
      maxSize: LOG_CONFIG.maxSize,
      maxFiles: LOG_CONFIG.retention,
    }),

    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true }), logFormat),
    }),
  ],
});

module.exports = logger;
