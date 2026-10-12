const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");

// Constants
const COLORS = require("../constants/COLORS");

const logDir = path.join(process.cwd(), "logs");
fs.mkdirSync(logDir, { recursive: true });

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

const createFileTransport = (level, maxFiles = "7d") =>
  new DailyRotateFile({
    dirname: logDir,
    filename: `${level}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
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
      dirname: logDir,
      filename: "combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
    }),

    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true }), logFormat),
    }),
  ],
});

module.exports = logger;
