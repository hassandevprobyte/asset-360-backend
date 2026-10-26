const { Queue } = require("bullmq");

// Config
const redis = require("../../config/redis");

// Constants
const QUEUES = require("../../constants/QUEUES");

const queueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: false,
  },
};

exports.inAppNotificationQueue = new Queue(QUEUES.IN_APP_NOTIFICATION, queueOptions);

exports.pushNotificationQueue = new Queue(QUEUES.PUSH_NOTIFICATION, queueOptions);

exports.emailNotificationQueue = new Queue(QUEUES.EMAIL_NOTIFICATION, queueOptions);
