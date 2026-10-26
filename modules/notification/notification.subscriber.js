const Boom = require("@hapi/boom");
const { Worker } = require("bullmq");

// Config
const redis = require("../../config/redis");

// Constants
const QUEUES = require("../../constants/QUEUES");
const NOTIFICATION = require("../../constants/NOTIFICATION");

// Handlers
const handlers = require("./notification.handler");

// Utilities
const logger = require("../../utils/logger");

const CHANNEL_HANDLERS = {
  [NOTIFICATION.CHANNELS.IN_APP]: handlers.inAppNotificationHandler,
  [NOTIFICATION.CHANNELS.PUSH]: handlers.pushNotificationHandler,
  [NOTIFICATION.CHANNELS.EMAIL]: handlers.emailNotificationHandler,
};

const createWorker = (queueName, channel) =>
  new Worker(
    queueName,
    async (job) => {
      const handler = CHANNEL_HANDLERS[channel];

      if (typeof handler !== "function") {
        throw Boom.badRequest(`Invalid notification handler for channel: ${channel}`);
      }

      return handler(job.data.payload);
    },
    {
      connection: redis,
      concurrency: 10,
    },
  );

const workers = [
  createWorker(QUEUES.IN_APP_NOTIFICATION, NOTIFICATION.CHANNELS.IN_APP),
  createWorker(QUEUES.PUSH_NOTIFICATION, NOTIFICATION.CHANNELS.PUSH),
  createWorker(QUEUES.EMAIL_NOTIFICATION, NOTIFICATION.CHANNELS.EMAIL),
];

workers.forEach((worker) => {
  worker.on("completed", (job) => {
    logger.info(`${job.name} completed`);
  });

  worker.on("failed", (job, error) => {
    logger.error(`${job?.name} failed:`, error.message);
  });

  worker.on("error", (error) => {
    logger.error(`Worker error (${worker.name}):`, error.message);
  });
});

module.exports = workers;
