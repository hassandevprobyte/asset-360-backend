const Boom = require("@hapi/boom");
const { Worker } = require("bullmq");

// Config
const redis = require("../../config/redis");

// Constants
const QUEUES = require("../../constants/QUEUES");
const NOTIFICATION = require("../../constants/NOTIFICATION");

// Handlers
const handlers = require("./notification.handler");

// Helpers
const { workerListeners } = require("./notification.helper");

const CHANNEL_HANDLERS = {
  [NOTIFICATION.CHANNELS.IN_APP]: handlers.inAppNotificationHandler,
  [NOTIFICATION.CHANNELS.PUSH]: handlers.pushNotificationHandler,
  [NOTIFICATION.CHANNELS.EMAIL]: handlers.emailNotificationHandler,
};

const createWorker = (queueName, channel) => {
  const handler = CHANNEL_HANDLERS[channel];

  if (typeof handler !== "function") {
    throw new Error(`Invalid notification handler for ${channel}`);
  }

  const worker = new Worker(queueName, (job) => handler(job.data.payload), {
    connection: redis,
    concurrency: 10,
  });

  workerListeners(worker, queueName, channel);

  return worker;
};

const workers = [
  createWorker(QUEUES.IN_APP_NOTIFICATION, NOTIFICATION.CHANNELS.IN_APP),
  createWorker(QUEUES.PUSH_NOTIFICATION, NOTIFICATION.CHANNELS.PUSH),
  createWorker(QUEUES.EMAIL_NOTIFICATION, NOTIFICATION.CHANNELS.EMAIL),
];

module.exports = workers;
