const { Worker } = require("bullmq");

// Config
const redis = require("../../config/redis");

// Constants
const QUEUES = require("../../constants/QUEUES");

// Consumer
const notificationConsumer = require("./notification.consumer");

const createWorker = (queueName) => {
  const worker = new Worker(
    queueName,
    async (job) => {
      await notificationConsumer.handle(job.data);
    },
    {
      connection: redis,
      concurrency: 10,
    },
  );

  worker.on("completed", (job) => {
    console.log(`${queueName}: job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`${queueName}: job ${job?.id} failed:`, error.message);
  });

  return worker;
};

const inAppWorker = createWorker(QUEUES.IN_APP_NOTIFICATION);
const pushWorker = createWorker(QUEUES.PUSH_NOTIFICATION);
const emailWorker = createWorker(QUEUES.EMAIL_NOTIFICATION);

module.exports = {
  emailWorker,
  inAppWorker,
  pushWorker,
};
